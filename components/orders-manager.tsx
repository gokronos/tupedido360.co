"use client";

import { ArrowLeft, CheckCircle2, Clock3, MapPin, PackageCheck, Phone, RefreshCw, ShoppingBag, Trash2, Truck, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus = "received" | "accepted" | "preparing" | "ready" | "on_way" | "delivered" | "cancelled";
type OrderItem = { productName: string; unitPriceCop: number; quantity: number; subtotalCop: number };
type Order = { id: string; reference: string; orderType: "delivery" | "pickup" | "dine_in"; customerName: string; customerPhone: string; deliveryAddress: string; neighborhood: string; addressReference: string; notes: string; status: OrderStatus; paid: boolean; paymentMethod: "cash" | "transfer" | "pay_at_store"; paymentStatus: "pending" | "pending_verification" | "verified"; deliveryFeeCop: number | null; deliveryQuoteStatus: "not_applicable" | "pending_quote" | "quoted" | "confirmed"; estimatedMinutes: number | null; totalCop: number; packagingTotalCop: number; createdAt: string; updatedAt: string; tableName?: string; createdByName?: string; items: OrderItem[] };
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
const statusInfo: Record<OrderStatus, { label: string; icon: typeof Clock3 }> = {
  received: { label: "Recibido", icon: Clock3 }, accepted: { label: "Aceptado", icon: CheckCircle2 }, preparing: { label: "Preparando", icon: UtensilsCrossed }, ready: { label: "Listo", icon: PackageCheck }, on_way: { label: "En camino", icon: Truck }, delivered: { label: "Entregado", icon: CheckCircle2 }, cancelled: { label: "Cancelado", icon: Clock3 },
};
const filters: Array<{ id: "active" | "all" | OrderStatus; label: string }> = [{ id: "active", label: "Activos" }, { id: "received", label: "Nuevos" }, { id: "preparing", label: "Preparando" }, { id: "ready", label: "Listos" }, { id: "on_way", label: "En camino" }, { id: "delivered", label: "Entregados" }, { id: "all", label: "Todos" }];
const paymentNames = { cash: "Efectivo", transfer: "Transferencia", pay_at_store: "Pago en el local" };

export function OrdersManager({role}:{role?:string}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("active");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const[deletedView,setDeletedView]=useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const response = await fetch("/api/orders", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) { setOrders(result.orders); setLastUpdate(new Date()); setError(""); }
    else setError(result.error ?? "No fue posible cargar los pedidos.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(true), 8000);
    return () => { window.clearTimeout(first); window.clearInterval(interval); };
  }, [load]);

  const visible = useMemo(() => orders.filter((order) => filter === "all" || (filter === "active" ? !["delivered", "cancelled"].includes(order.status) : order.status === filter)), [orders, filter]);
  const pending = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;

  async function action(payload: Record<string, unknown>, id: string) {
    setUpdating(id); setError("");
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "No fue posible actualizar el pedido.");
    else await load(true);
    setUpdating("");
  }

  if(deletedView)return <DeletedOrders onBack={()=>setDeletedView(false)}/>;
  return <div className="orders-manager">
    <div className="orders-toolbar"><div><strong>{pending}</strong><span>pedidos activos</span></div><div className="orders-toolbar-actions">{role==="owner"&&<button onClick={()=>setDeletedView(true)}><Trash2 size={17}/>Eliminados</button>}<button onClick={() => load()} disabled={loading}><RefreshCw size={17} className={loading ? "spinning" : ""} />Actualizar</button></div></div>
    <div className="order-filters">{filters.map((item) => <button className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)} key={item.id}>{item.label}{item.id !== "all" && <span>{item.id === "active" ? pending : orders.filter((order) => order.status === item.id).length}</span>}</button>)}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading && !orders.length ? <div className="catalog-loading">Cargando pedidos...</div> : visible.length === 0 ? <section className="empty-orders orders-empty"><ShoppingBag size={30} /><h3>No hay pedidos en esta vista</h3><p>Los pedidos nuevos del menú público aparecerán automáticamente.</p></section> : <div className="orders-grid">{visible.map((order) => <OrderCard key={order.id} order={order} busy={updating === order.id} onAction={(payload) => action(payload, order.id)} />)}</div>}
    <p className="orders-refresh-note">Actualización automática cada 8 segundos{lastUpdate ? ` · Última: ${lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}</p>
  </div>;
}

function OrderCard({ order, busy, onAction }: { order: Order; busy: boolean; onAction: (payload: Record<string, unknown>) => void }) {
  const StatusIcon = statusInfo[order.status].icon;
  const statusOptions: OrderStatus[] = order.orderType === "delivery" ? ["received","accepted","preparing","ready","on_way","delivered","cancelled"] : ["received","accepted","preparing","ready","delivered","cancelled"];
  const whatsapp = order.customerPhone.replace(/\D/g, "").replace(/^3/, "573");
  const quoteMessage = order.deliveryFeeCop === null ? "" : encodeURIComponent(`Hola ${order.customerName}, el domicilio de tu pedido ${order.reference} cuesta ${money(order.deliveryFeeCop)}. El total es ${money(order.totalCop)}${order.estimatedMinutes ? ` y el tiempo estimado es de ${order.estimatedMinutes} minutos` : ""}. ¿Deseas confirmar el pedido?`);
  function quote() {
    const feeCop = Number(window.prompt("Valor del domicilio", String(order.deliveryFeeCop ?? "")));
    if (!Number.isFinite(feeCop) || feeCop < 0) return;
    const estimatedMinutes = Number(window.prompt("Tiempo estimado en minutos", String(order.estimatedMinutes ?? 30)));
    if (!Number.isFinite(estimatedMinutes)) return;
    onAction({ action: "quoteDelivery", id: order.id, feeCop, estimatedMinutes });
  }
  return <article className={`order-card status-${order.status}`}>
    <header><div><span className="order-reference">{order.reference}</span><span className={`order-status ${order.status}`}><StatusIcon size={14} />{statusInfo[order.status].label}</span></div><time>{new Date(order.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></header>
    <div className="order-customer"><strong>{order.tableName ?? order.customerName}</strong>{order.customerPhone && <a href={`tel:${order.customerPhone}`}><Phone size={14} />{order.customerPhone}</a>}<span>{order.orderType === "delivery" ? <><Truck size={15} />Domicilio</> : order.orderType === "dine_in" ? <><UtensilsCrossed size={15} />Mesa · {order.createdByName ?? "Mesero"}</> : <><ShoppingBag size={15} />Para llevar</>}</span>{order.deliveryAddress && <address><MapPin size={14} />{order.deliveryAddress}{order.neighborhood ? `, ${order.neighborhood}` : ""}{order.addressReference ? ` · ${order.addressReference}` : ""}</address>}<small>Pago: {paymentNames[order.paymentMethod] ?? order.paymentMethod}</small></div>
    <div className="order-lines">{order.items.map((item, index) => <div key={`${item.productName}-${index}`}><span><b>{item.quantity}x</b>{item.productName}</span><strong>{money(item.subtotalCop)}</strong></div>)}</div>
    {order.packagingTotalCop > 0 && <div className="order-packaging"><span>Recipientes</span><strong>{money(order.packagingTotalCop)}</strong></div>}
    {order.orderType === "delivery" && <div className="delivery-quote"><div><strong>{order.deliveryFeeCop === null ? "Domicilio por cotizar" : `Domicilio: ${money(order.deliveryFeeCop)}`}</strong>{order.estimatedMinutes && <span>{order.estimatedMinutes} minutos estimados</span>}</div><div><button disabled={busy} onClick={quote}>{order.deliveryFeeCop === null ? "Cotizar" : "Cambiar tarifa"}</button>{order.deliveryFeeCop !== null && order.customerPhone && <a href={`https://wa.me/${whatsapp}?text=${quoteMessage}`} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>}{order.deliveryFeeCop !== null && order.deliveryQuoteStatus !== "confirmed" && <button disabled={busy} onClick={() => onAction({ action: "confirmDelivery", id: order.id })}>Cliente confirmó</button>}</div></div>}
    {order.notes && <p className="order-notes">Nota: {order.notes}</p>}
    <div className="order-total"><span>Total</span><strong>{money(order.totalCop)}</strong></div>
    <footer><label><span>Pago</span><select value={order.paymentStatus} disabled={busy} onChange={(event) => onAction({ action: "updatePaymentStatus", id: order.id, status: event.target.value })}><option value="pending">Pendiente</option>{order.paymentMethod === "transfer" && <option value="pending_verification">Por verificar</option>}<option value="verified">Verificado</option></select></label><label><span>Estado</span><select value={order.status} disabled={busy} onChange={(event) => onAction({ action: "updateStatus", id: order.id, status: event.target.value })}>{statusOptions.map((status) => <option value={status} key={status}>{statusInfo[status].label}</option>)}</select></label><button className="delete-order-button" disabled={busy} title="Eliminar pedido" onClick={()=>{const reason=window.prompt(`¿Por qué se elimina el pedido ${order.reference}?`);if(reason!==null)onAction({action:"deleteOrder",id:order.id,reason})}}><Trash2 size={16}/>Eliminar</button></footer>
  </article>;
}

type DeletedOrder={id:string;reference:string;reason:string;deletedByName:string;deletedByRole:string;deletedAt:string;snapshot:{customer_name?:string;total_cop?:number;order_type?:string}};
function DeletedOrders({onBack}:{onBack:()=>void}){const[orders,setOrders]=useState<DeletedOrder[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");const load=useCallback(async()=>{setLoading(true);const response=await fetch("/api/orders?view=deleted",{cache:"no-store"});const result=await response.json();if(response.ok)setOrders(result.deletedOrders);else setError(result.error);setLoading(false)},[]);useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[load]);async function purge(order:DeletedOrder){if(!window.confirm(`¿Quitar definitivamente ${order.reference} del historial de tu negocio? TuPedido360 conservará la auditoría.`))return;const response=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"purgeDeleted",id:order.id})});const result=await response.json();if(response.ok)await load();else setError(result.error)}return <div className="deleted-orders"><div className="manager-heading"><div><button className="back-deleted" onClick={onBack}><ArrowLeft size={17}/>Volver a pedidos</button><h2>Pedidos eliminados</h2><p>Revisa quién eliminó cada pedido y el motivo indicado.</p></div></div>{error&&<p className="form-error">{error}</p>}{loading?<div className="catalog-loading">Cargando eliminados...</div>:orders.length?<div className="deleted-order-list">{orders.map(order=><article key={order.id}><div><strong>{order.reference}</strong><span>{order.snapshot.customer_name||"Cliente"}</span></div><div><b>Motivo</b><p>{order.reason}</p></div><div><b>Eliminado por</b><span>{order.deletedByName} · {order.deletedByRole}</span><small>{new Date(order.deletedAt).toLocaleString("es-CO")}</small></div><strong>{money(Number(order.snapshot.total_cop??0))}</strong><button onClick={()=>purge(order)}><Trash2 size={16}/>Eliminar de mi negocio</button></article>)}</div>:<section className="empty-orders"><Trash2 size={30}/><h3>No hay pedidos eliminados</h3><p>Los pedidos retirados por el equipo aparecerán aquí.</p></section>}</div>}
