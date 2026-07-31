"use client";

import { Edit3, ImageIcon, PackagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ImageUpload } from "@/components/image-upload";

type Category = { id: string; name: string; active: boolean; sortOrder: number };
type Product = { id: string; name: string; description: string; priceCop: number; packagingFeeCop: number; icon: string; imageUrl: string; active: boolean; categoryId: string | null; categoryName: string | null };
type Catalog = { categories: Category[]; products: Product[] };
const productIcons = ["🍔","🌭","🍕","🍗","🥩","🍟","🌮","🌯","🥪","🥗","🍝","🍜","🍚","🍲","🍰","🍩","🍦","🥤","☕","🍺","🍽️"];

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export function ProductManager() {
  const [catalog, setCatalog] = useState<Catalog>({ categories: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [categoryEditor,setCategoryEditor]=useState(false);

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
  const filtered = useMemo(() => catalog.products.filter((product) => `${product.name} ${product.categoryName ?? ""}`.toLowerCase().includes(search.toLowerCase())), [catalog.products, search]);

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
    {error && <p className="form-error" role="alert">{error}</p>}
    {catalog.categories.length > 0 && <div className="category-strip"><button className="active">Todos</button>{catalog.categories.map((category) => <button key={category.id}>{category.name}</button>)}</div>}
    {loading ? <div className="catalog-loading">Cargando catálogo...</div> : filtered.length === 0 ? <section className="empty-orders catalog-empty"><PackagePlus size={30} /><h3>{search ? "No encontramos productos" : "Agrega tu primer producto"}</h3><p>{search ? "Prueba con otro nombre o categoría." : "Crea categorías y productos para comenzar a recibir pedidos."}</p>{!search && <button onClick={() => setEditing(null)}>Nuevo producto</button>}</section> : <div className="product-list">{filtered.map((product) => <article key={product.id} className={!product.active ? "disabled" : ""}>
      <div className="product-thumb" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{!product.imageUrl && <span className="product-emoji">{product.icon || <ImageIcon size={24} />}</span>}</div>
      <div className="product-info"><span>{product.categoryName ?? "Sin categoría"}</span><strong>{product.name}</strong><p>{product.description || "Sin descripción"}{product.packagingFeeCop > 0 ? ` · Recipiente ${money(product.packagingFeeCop)}` : ""}</p></div>
      <b>{money(product.priceCop)}</b>
      <label className="status-toggle" title={product.active ? "Producto disponible" : "Producto oculto"}><input type="checkbox" checked={product.active} onChange={() => action({ action: "toggleProduct", id: product.id })} /><span /></label>
      <button className="row-icon" onClick={() => setEditing(product)} title="Editar producto" aria-label={`Editar ${product.name}`}><Edit3 size={18} /></button>
      <button className="row-icon danger-icon" onClick={() => { if (window.confirm(`¿Eliminar ${product.name}?`)) void action({ action: "deleteProduct", id: product.id }); }} title="Eliminar producto" aria-label={`Eliminar ${product.name}`}><Trash2 size={18} /></button>
    </article>)}</div>}
    {editing !== undefined && <ProductEditor product={editing} categories={catalog.categories} onClose={() => setEditing(undefined)} onSave={async (values) => { if (await action({ action: "saveProduct", ...values })) setEditing(undefined); }} />}
    {categoryEditor&&<div className="editor-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setCategoryEditor(false)}}><form className="small-editor" onSubmit={async event=>{event.preventDefault();const name=String(new FormData(event.currentTarget).get("name")??"");if(await action({action:"createCategory",name}))setCategoryEditor(false)}}><header><div><h2>Nueva categoría</h2><p>Agrupa productos para encontrarlos rápidamente.</p></div><button type="button" onClick={()=>setCategoryEditor(false)}><X size={19}/></button></header><label><span>Nombre</span><input name="name" required minLength={2} maxLength={50} autoFocus placeholder="Ej. Hamburguesas"/></label><footer><button className="secondary-action" type="button" onClick={()=>setCategoryEditor(false)}>Cancelar</button><button className="primary-compact">Crear categoría</button></footer></form></div>}
  </div>;
}

function ProductEditor({ product, categories, onClose, onSave }: { product: Product | null; categories: Category[]; onClose: () => void; onSave: (values: Record<string, unknown>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [icon, setIcon] = useState(product?.icon ?? "🍽️");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const form = new FormData(event.currentTarget);
    await onSave({ id: product?.id, name: form.get("name"), categoryId: form.get("categoryId"), description: form.get("description"), priceCop: Number(form.get("priceCop")), packagingFeeCop: Number(form.get("packagingFeeCop")), icon, imageUrl: form.get("imageUrl") });
    setSaving(false);
  }
  return <div className="editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="product-editor" onSubmit={submit}>
    <header><div><h2>{product ? "Editar producto" : "Nuevo producto"}</h2><p>Información visible para clientes y empleados.</p></div><button type="button" onClick={onClose} title="Cerrar" aria-label="Cerrar"><X size={20} /></button></header>
    <label><span>Nombre</span><input name="name" defaultValue={product?.name} required minLength={2} maxLength={100} placeholder="Ej. Hamburguesa especial" /></label>
    <div className="field-row"><label><span>Categoría</span><select name="categoryId" defaultValue={product?.categoryId ?? ""}><option value="">Sin categoría</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label><span>Precio</span><input name="priceCop" type="number" min="0" step="100" defaultValue={product?.priceCop} required placeholder="20000" /></label></div>
    <label><span>Precio del recipiente</span><input name="packagingFeeCop" type="number" min="0" step="100" defaultValue={product?.packagingFeeCop ?? 0} required /><small>Se cobra por unidad solo en pedidos para llevar o domicilio. Usa 0 si no aplica.</small></label>
    <label><span>Descripción</span><textarea name="description" defaultValue={product?.description} maxLength={500} rows={4} placeholder="Ingredientes o detalles importantes" /></label>
    <div className="product-icon-field"><span>Icono del producto</span><div className="product-icon-picker">{productIcons.map((item) => <button type="button" className={icon === item ? "selected" : ""} onClick={() => setIcon(item)} key={item}>{item}</button>)}</div><label className="custom-product-icon"><span>Otro emoji</span><input value={icon} maxLength={12} onChange={(event) => setIcon(event.target.value)} /></label></div>
    <input name="imageUrl" type="hidden" value={imageUrl} />
    <ImageUpload label="Foto del producto" value={imageUrl} onChange={setImageUrl} />
    <footer><button className="secondary-action" type="button" onClick={onClose}>Cancelar</button><button className="primary-compact" disabled={saving} type="submit">{saving ? "Guardando..." : "Guardar producto"}</button></footer>
  </form></div>;
}
