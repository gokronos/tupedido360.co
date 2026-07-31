"use client";

import { CheckCircle2, ChevronLeft, Minus, Plus, Search, ShoppingBag, Store, Truck, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Product = { id: string; categoryId: string | null; name: string; description: string; priceCop: number; imageUrl: string };
type Category = { id: string; name: string };
type Cart = Record<string, number>;
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export function PublicStore({ business, categories, products }: { business: { name: string; slug: string }; categories: Category[]; products: Product[] }) {
  const [cart, setCart] = useState<Cart>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ reference: string; totalCop: number } | null>(null);
  const visible = useMemo(() => products.filter((product) => (category === "all" || product.categoryId === category) && `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const cartItems = products.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: cart[product.id] }));
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + item.priceCop * item.quantity, 0);

  function quantity(id: string, change: number) {
    setCart((current) => { const next = Math.max(0, (current[id] ?? 0) + change); const result = { ...current, [id]: next }; if (!next) delete result[id]; return result; });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/public/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: business.slug, orderType, customerName: form.get("customerName"), customerPhone: form.get("customerPhone"), deliveryAddress: form.get("deliveryAddress"), notes: form.get("notes"), items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })) }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "No fue posible enviar el pedido."); setSending(false); return; }
    setConfirmation(result); setCart({}); setSending(false);
  }

  return <main className="storefront">
    <header className="storefront-header"><div className="storefront-inner"><div className="storefront-brand"><span><Store size={23} /></span><div><strong>{business.name}</strong><small>Pedidos en línea</small></div></div><button className="store-cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={20} /><span>Mi pedido</span>{itemCount > 0 && <b>{itemCount}</b>}</button></div></header>
    <section className="storefront-intro"><div><p>Bienvenido</p><h1>{business.name}</h1><span>Elige tus productos y pide para domicilio o para llevar.</span></div></section>
    <div className="storefront-tools"><label><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en el menú" /></label><div><button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>Todo</button>{categories.map((item) => <button className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)} key={item.id}>{item.name}</button>)}</div></div>
    <section className="storefront-menu"><div className="storefront-menu-heading"><h2>Nuestro menú</h2><span>{visible.length} productos</span></div>{visible.length ? <div className="store-product-grid">{visible.map((product) => <article key={product.id}><div className="store-product-image" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{!product.imageUrl && <Store size={30} />}</div><div className="store-product-body"><h3>{product.name}</h3><p>{product.description || "Preparado especialmente para ti."}</p><footer><strong>{money(product.priceCop)}</strong>{cart[product.id] ? <div className="quantity-control"><button onClick={() => quantity(product.id, -1)} aria-label={`Quitar ${product.name}`}><Minus size={16} /></button><span>{cart[product.id]}</span><button onClick={() => quantity(product.id, 1)} aria-label={`Agregar ${product.name}`}><Plus size={16} /></button></div> : <button className="add-product" onClick={() => quantity(product.id, 1)}><Plus size={17} /> Agregar</button>}</footer></div></article>)}</div> : <div className="store-empty">No encontramos productos con esa búsqueda.</div>}</section>
    <footer className="storefront-footer"><strong>{business.name}</strong><span>Impulsado por TuPedido360, un producto de Imagen Plus.</span></footer>
    {itemCount > 0 && <button className="mobile-cart-bar" onClick={() => setCartOpen(true)}><span><ShoppingBag size={18} /> Ver pedido ({itemCount})</span><strong>{money(total)}</strong></button>}
    {cartOpen && <div className="cart-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer"><header><div><h2>{checkout ? "Finalizar pedido" : "Tu pedido"}</h2><p>{itemCount} productos</p></div><button onClick={() => setCartOpen(false)} aria-label="Cerrar"><X size={20} /></button></header>{confirmation ? <div className="order-confirmation"><CheckCircle2 size={44} /><h3>¡Pedido recibido!</h3><p>Tu número de pedido es</p><strong>{confirmation.reference}</strong><span>Total: {money(confirmation.totalCop)}</span><button onClick={() => { setConfirmation(null); setCheckout(false); setCartOpen(false); }}>Cerrar</button></div> : checkout ? <Checkout orderType={orderType} setOrderType={setOrderType} total={total} sending={sending} error={error} onBack={() => setCheckout(false)} onSubmit={submit} /> : <><div className="cart-items">{cartItems.map((item) => <article key={item.id}><div><strong>{item.name}</strong><span>{money(item.priceCop)}</span></div><div className="quantity-control"><button onClick={() => quantity(item.id, -1)}><Minus size={15} /></button><span>{item.quantity}</span><button onClick={() => quantity(item.id, 1)}><Plus size={15} /></button></div><b>{money(item.priceCop * item.quantity)}</b></article>)}</div><footer className="cart-total"><div><span>Total</span><strong>{money(total)}</strong></div><button disabled={!itemCount} onClick={() => setCheckout(true)}>Continuar</button></footer></>}</aside></div>}
  </main>;
}

function Checkout({ orderType, setOrderType, total, sending, error, onBack, onSubmit }: { orderType: "pickup" | "delivery"; setOrderType: (value: "pickup" | "delivery") => void; total: number; sending: boolean; error: string; onBack: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="checkout-form" onSubmit={onSubmit}><button type="button" className="back-checkout" onClick={onBack}><ChevronLeft size={17} /> Volver al carrito</button><div className="order-type"><button type="button" className={orderType === "pickup" ? "active" : ""} onClick={() => setOrderType("pickup")}><ShoppingBag size={20} /><span><strong>Para llevar</strong><small>Recoger en el negocio</small></span></button><button type="button" className={orderType === "delivery" ? "active" : ""} onClick={() => setOrderType("delivery")}><Truck size={20} /><span><strong>Domicilio</strong><small>Recibir en tu dirección</small></span></button></div><label><span>Nombre</span><input name="customerName" required minLength={3} placeholder="Tu nombre completo" /></label><label><span>Celular</span><input name="customerPhone" type="tel" required minLength={7} placeholder="300 000 0000" /></label>{orderType === "delivery" && <label><span>Dirección</span><input name="deliveryAddress" required minLength={5} placeholder="Calle, número y barrio" /></label>}<label><span>Notas para el negocio</span><textarea name="notes" rows={3} maxLength={500} placeholder="Opcional" /></label>{error && <p className="form-error">{error}</p>}<footer className="checkout-submit"><div><span>Total</span><strong>{money(total)}</strong></div><button disabled={sending} type="submit">{sending ? "Enviando..." : "Confirmar pedido"}</button></footer></form>;
}
