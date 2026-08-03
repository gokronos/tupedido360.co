"use client";

import {
  CheckCircle2,
  LogOut,
  Minus,
  Plus,
  Search,
  Send,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppSession } from "@/lib/session";
type Product = {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  icon: string;
  categoryId: string | null;
  categoryName: string | null;
};
type Table = { id: string; name: string; active: boolean };
type Cart = Record<string, number>;
const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
export function WaiterDashboard({ session, embedded = false }: { session: AppSession; embedded?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const load = useCallback(async () => {
    const [catalogResponse, tablesResponse] = await Promise.all([
      fetch("/api/catalog"),
      fetch("/api/tables"),
    ]);
    const catalog = await catalogResponse.json();
    const tableData = await tablesResponse.json();
    if (catalogResponse.ok) setProducts(catalog.products);
    if (tablesResponse.ok)
      setTables(tableData.tables.filter((table: Table) => table.active));
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const visible = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.categoryName ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [products, search],
  );
  const items = products
    .filter((product) => cart[product.id])
    .map((product) => ({ ...product, quantity: cart[product.id] }));
  const total = items.reduce(
    (sum, item) => sum + item.priceCop * item.quantity,
    0,
  );
  function quantity(id: string, change: number) {
    setCart((current) => {
      const value = Math.max(0, (current[id] ?? 0) + change);
      const next = { ...current, [id]: value };
      if (!value) delete next[id];
      return next;
    });
  }
  async function submit() {
    if (!tableId || !items.length) {
      setError("Selecciona una mesa y agrega productos.");
      return;
    }
    setSending(true);
    setError("");
    const response = await fetch("/api/waiter/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tableId,
        notes,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error);
    else {
      setConfirmation(result.reference);
      setCart({});
      setNotes("");
    }
    setSending(false);
  }
  return (
    <main className={`waiter-shell${embedded ? " waiter-embedded" : ""}`}>
      {!embedded && <header>
        <div className="waiter-brand">
          <span>
            <UtensilsCrossed size={21} />
          </span>
          <div>
            <strong>{session.businessName}</strong>
            <small>Mesero · {session.name}</small>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button title="Cerrar sesión">
            <LogOut size={19} />
          </button>
        </form>
      </header>}
      <section className="waiter-main">
        <div className="waiter-top">
          <label>
            <span>Mesa del pedido</span>
            <select
              value={tableId}
              onChange={(event) => setTableId(event.target.value)}
            >
              <option value="">Seleccionar mesa</option>
              {tables.map((table) => (
                <option value={table.id} key={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </label>
          <label className="waiter-search">
            <span>Buscar producto</span>
            <div>
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o categoría"
              />
            </div>
          </label>
        </div>
        {confirmation && (
          <div className="waiter-confirmation">
            <CheckCircle2 size={20} />
            Pedido {confirmation} enviado a cocina.
            <button onClick={() => setConfirmation("")}>Cerrar</button>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="waiter-products">
          {visible.map((product) => (
            <article key={product.id}>
              <span className="waiter-product-icon">
                {product.icon || "🍽️"}
              </span>
              <div>
                <small>{product.categoryName ?? "Sin categoría"}</small>
                <strong>{product.name}</strong>
                <span>{money(product.priceCop)}</span>
              </div>
              {cart[product.id] ? (
                <div className="quantity-control">
                  <button onClick={() => quantity(product.id, -1)}>
                    <Minus size={16} />
                  </button>
                  <span>{cart[product.id]}</span>
                  <button onClick={() => quantity(product.id, 1)}>
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <button
                  className="waiter-add"
                  onClick={() => quantity(product.id, 1)}
                >
                  <Plus size={18} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
      <aside className="waiter-cart">
        <div>
          <Store size={19} />
          <strong>
            {tables.find((table) => table.id === tableId)?.name ?? "Sin mesa"}
          </strong>
          <span>
            {items.reduce((sum, item) => sum + item.quantity, 0)} productos
          </span>
        </div>
        <div className="waiter-cart-lines">
          {items.map((item) => (
            <p key={item.id}>
              <span>
                {item.quantity}x {item.name}
              </span>
              <b>{money(item.priceCop * item.quantity)}</b>
            </p>
          ))}
          {!items.length && (
            <p className="waiter-cart-empty">Agrega productos del menú.</p>
          )}
        </div>
        <label>
          <span>Nota para cocina</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        </label>
        <footer>
          <div>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <button
            disabled={sending || !tableId || !items.length}
            onClick={submit}
          >
            <Send size={18} />
            {sending ? "Enviando..." : "Enviar pedido"}
          </button>
        </footer>
      </aside>
    </main>
  );
}
