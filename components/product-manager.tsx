"use client";

import { AlertTriangle, Edit3, ImageIcon, PackagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { useBackDismiss } from "@/components/use-back-dismiss";

type Category = { id: string; name: string; active: boolean; sortOrder: number };
type Product = { id: string; name: string; description: string; priceCop: number; packagingFeeCop: number; icon: string; imageUrl: string; active: boolean; categoryId: string | null; categoryName: string | null; stockQuantity: number | null };
type Catalog = { categories: Category[]; products: Product[] };
const productIcons = ["🍔","🌭","🍕","🍗","🥩","🍟","🌮","🌯","🥪","🥗","🍝","🍜","🍚","🍲","🍰","🍩","🍦","🥤","☕","🍺","🍷","🍸","🧃","🍽️"];

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export function ProductManager() {
  const [catalog, setCatalog] = useState<Catalog>({ categories: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [categoryEditor,setCategoryEditor]=useState(false);
  useBackDismiss(categoryEditor, () => setCategoryEditor(false));

  const load = useCallback(async () => {
    const response = await fetch("/api/catalog");
    const result = await response.json();
    if (response.ok) setCatalog(result);
    else setError(result.error ?? "No fue posible cargar el catálogo.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => catalog.products.filter((product) => {
    const matchesSearch = `${product.name} ${product.categoryName ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryId === null || product.categoryId === categoryId;
    return matchesSearch && matchesCategory;
  }), [catalog.products, search, categoryId]);
  const lowStockProducts = useMemo(() => catalog.products.filter((p) => p.stockQuantity !== null && p.stockQuantity <= 3), [catalog.products]);

  async function action(payload: Record<string, unknown>) {
    setError("");
    const response = await fetch("/api/catalog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "No fue posible guardar el cambio."); return false; }
    await load();
    return true;
  }

  return <div className="catalog-manager">
    <div className="catalog-toolbar">
      <label className="catalog-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos" /></label>
      <button className="secondary-action" onClick={()=>setCategoryEditor(true)}><Plus size={18} /> Categoría</button>
      <button className="primary-compact" onClick={() => setEditing(null)}><PackagePlus size={18} /> Nuevo producto</button>
    </div>
    {lowStockProducts.length > 0 && (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "rgba(217, 119, 6, 0.12)", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "10px", margin: "1rem 0", color: "#d97706", fontSize: "0.9rem" }}>
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <span><strong>Alerta de inventario:</strong> {lowStockProducts.length} producto(s) con stock bajo o agotados ({lowStockProducts.map(p => `${p.name}: ${p.stockQuantity === 0 ? "Agotado" : `${p.stockQuantity} unid.`}`).join(", ")}).</span>
      </div>
    )}
    {error && <p className="form-error" role="alert">{error}</p>}
    {catalog.categories.length > 0 && <div className="category-strip"><button className={categoryId === null ? "active" : ""} onClick={() => setCategoryId(null)}>Todos</button>{catalog.categories.map((category) => <button className={categoryId === category.id ? "active" : ""} onClick={() => setCategoryId(category.id)} key={category.id}>{category.name}</button>)}</div>}
    {loading ? <div className="catalog-loading">Cargando catálogo...</div> : filtered.length === 0 ? <section className="empty-orders catalog-empty"><PackagePlus size={30} /><h3>{search || categoryId ? "No encontramos productos" : "Agrega tu primer producto"}</h3><p>{search || categoryId ? "Pruebe con otro nombre o seleccione otra categoría." : "Cree categorías y productos para comenzar a recibir pedidos."}</p>{!search && !categoryId && <button onClick={() => setEditing(null)}>Nuevo producto</button>}</section> : <div className="product-list">{filtered.map((product) => <article key={product.id} className={!product.active ? "disabled" : ""}>
      <div className="product-thumb" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{!product.imageUrl && <span className="product-emoji">{product.icon || <ImageIcon size={24} />}</span>}</div>
      <div className="product-info">
        <span>{product.categoryName ?? "Sin categoría"}</span>
        <strong>{product.name}</strong>
        <p>{product.description || "Sin descripción"}{product.packagingFeeCop > 0 ? ` · Recipiente ${money(product.packagingFeeCop)}` : ""}</p>
        {product.stockQuantity !== null && (
          <span style={{ display: "inline-block", marginTop: "0.3rem", fontSize: "0.78rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "6px", backgroundColor: product.stockQuantity === 0 ? "rgba(229, 62, 62, 0.15)" : product.stockQuantity <= 3 ? "rgba(217, 119, 6, 0.15)" : "rgba(56, 161, 105, 0.15)", color: product.stockQuantity === 0 ? "#e53e3e" : product.stockQuantity <= 3 ? "#d97706" : "#38a169" }}>
            {product.stockQuantity === 0 ? "⚠️ Agotado (0 unid.)" : product.stockQuantity <= 3 ? `🔥 ¡Quedan pocas! (${product.stockQuantity} unid.)` : `Stock: ${product.stockQuantity} unid.`}
          </span>
        )}
      </div>
      <b>{money(product.priceCop)}</b>
      <label className="status-toggle" title={product.active ? "Producto disponible" : "Producto oculto"}><input type="checkbox" checked={product.active} onChange={() => action({ action: "toggleProduct", id: product.id })} /><span /></label>
      <button className="row-icon" onClick={() => setEditing(product)} title="Editar producto" aria-label={`Editar ${product.name}`}><Edit3 size={18} /></button>
      <button className="row-icon danger-icon" onClick={() => { if (window.confirm(`¿Eliminar ${product.name}?`)) void action({ action: "deleteProduct", id: product.id }); }} title="Eliminar producto" aria-label={`Eliminar ${product.name}`}><Trash2 size={18} /></button>
    </article>)}</div>}
    {editing !== undefined && <ProductEditor product={editing} categories={catalog.categories} onClose={() => setEditing(undefined)} onSave={async (values) => { if (await action({ action: "saveProduct", ...values })) setEditing(undefined); }} />}
    {categoryEditor&&<div className="editor-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setCategoryEditor(false)}}><form className="small-editor" onSubmit={async event=>{event.preventDefault();const name=String(new FormData(event.currentTarget).get("name")??"");if(await action({action:"createCategory",name}))setCategoryEditor(false)}}><header><div><h2>Nueva categoría</h2><p>Agrupa productos para encontrarlos rápidamente.</p></div><button type="button" onClick={()=>setCategoryEditor(false)}><X size={19}/></button></header><label><span>Nombre</span><input name="name" required minLength={2} maxLength={50} autoFocus placeholder="Ej. Gaseosas y Bebidas"/></label><footer><button className="secondary-action" type="button" onClick={()=>setCategoryEditor(false)}>Cancelar</button><button className="primary-compact">Crear categoría</button></footer></form></div>}
  </div>;
}

function ProductEditor({ product, categories, onClose, onSave }: { product: Product | null; categories: Category[]; onClose: () => void; onSave: (values: Record<string, unknown>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [icon, setIcon] = useState(product?.icon ?? "🍽️");
  const [trackStock, setTrackStock] = useState(product?.stockQuantity !== null && product?.stockQuantity !== undefined);
  const [stockQuantity, setStockQuantity] = useState<number>(product?.stockQuantity ?? 10);
  useBackDismiss(true, onClose);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    await onSave({
      id: product?.id,
      name: form.get("name"),
      categoryId: form.get("categoryId"),
      description: form.get("description"),
      priceCop: Number(form.get("priceCop")),
      packagingFeeCop: Number(form.get("packagingFeeCop")),
      icon,
      imageUrl: form.get("imageUrl"),
      trackStock,
      stockQuantity: trackStock ? Number(stockQuantity) : null,
    });
    setSaving(false);
  }
  return <div className="editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="product-editor" onSubmit={submit}>
    <header><div><h2>{product ? "Editar producto" : "Nuevo producto"}</h2><p>Información visible para clientes y empleados.</p></div><button type="button" onClick={onClose} title="Cerrar" aria-label="Cerrar"><X size={20} /></button></header>
    <label><span>Nombre</span><input name="name" defaultValue={product?.name} required minLength={2} maxLength={100} placeholder="Ej. Gaseosa Coca-Cola 350ml" /></label>
    <div className="field-row"><label><span>Categoría</span><select name="categoryId" defaultValue={product?.categoryId ?? ""}><option value="">Sin categoría</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label><span>Precio</span><input name="priceCop" type="number" min="0" step="100" defaultValue={product?.priceCop} required placeholder="5000" /></label></div>
    <label><span>Precio del recipiente</span><input name="packagingFeeCop" type="number" min="0" step="100" defaultValue={product?.packagingFeeCop ?? 0} required /><small>Se cobra por unidad solo en pedidos para llevar o domicilio. Usa 0 si no aplica.</small></label>
    <div className="field-row">
      <label>
        <span>Control de Inventario / Stock</span>
        <select value={trackStock ? "tracked" : "unlimited"} onChange={(e) => setTrackStock(e.target.value === "tracked")}>
          <option value="unlimited">Sin límite (ej. platos preparados)</option>
          <option value="tracked">Controlar stock (ej. gaseosas, cervezas)</option>
        </select>
      </label>
      {trackStock && (
        <label>
          <span>Unidades disponibles</span>
          <input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value)))} required placeholder="Ej. 24" />
        </label>
      )}
    </div>
    {trackStock && (
      <small style={{ marginTop: "-0.5rem", marginBottom: "0.5rem", color: "var(--text-muted, #94a3b8)", fontSize: "0.82rem" }}>
        Se irá descontando automáticamente con cada pedido. Al quedar 3 unidades o menos saldrá alerta en el panel, y al llegar a 0 se ocultará del menú público.
      </small>
    )}
    <label><span>Descripción</span><textarea name="description" defaultValue={product?.description} maxLength={500} rows={3} placeholder="Detalles o ingredientes del producto" /></label>
    <div className="product-icon-field"><span>Icono del producto</span><div className="product-icon-picker">{productIcons.map((item) => <button type="button" className={icon === item ? "selected" : ""} onClick={() => setIcon(item)} key={item}>{item}</button>)}</div><label className="custom-product-icon"><span>Otro emoji</span><input value={icon} maxLength={12} onChange={(event) => setIcon(event.target.value)} /></label></div>
    <input name="imageUrl" type="hidden" value={imageUrl} />
    <ImageUpload label="Foto del producto" value={imageUrl} onChange={setImageUrl} />
    <footer><button className="secondary-action" type="button" onClick={onClose}>Cancelar</button><button className="primary-compact" disabled={saving} type="submit">{saving ? "Guardando..." : "Guardar producto"}</button></footer>
  </form></div>;
}
