"use client";

import { CheckCircle2, Clock3, MapPin, PackageCheck, Phone, RefreshCw, ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus = "received" | "preparing" | "ready" | "delivered" | "cancelled";
type OrderItem = { productName: string; unitPriceCop: number; quantity: number; subtotalCop: number };
type Order = { id: string; reference: string; orderType: "delivery" | "pickup"; customerName: string; customerPhone: string; deliveryAddress: string; notes: string; status: OrderStatus; paid: boolean; totalCop: number; createdAt: string; items: OrderItem[] };
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
const statusInfo: Record<OrderStatus, { label: string; icon: typeof Clock3 }> = {
  received: { label: "Recibido", icon: Clock3 }, preparing: { label: "Preparando", icon: UtensilsCrossed }, ready: { label: "Listo", icon: PackageCheck }, delivered: { label: "Entregado", icon: CheckCircle2 }, cancelled: { label: "Cancelado", icon: Clock3 },
};
const filters: Array<{ id: "active" | "all" | OrderStatus; label: string }> = [{ id: "active", label: "Activos" }, { id: "received", label: "Recibidos" }, { id: "preparing", label: "Preparando" }, { id: "ready", label: "Listos" }, { id: "delivered", label: "Entregados" }, { id: "all", label: "Todos" }];

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("active");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

  return <div className="orders-manager">
    <div className="orders-toolbar"><div><strong>{pending}</strong><span>pedidos activos</span></div><button onClick={() => load()} disabled={loading}><RefreshCw size={17} className={loading ? "spinning" : ""} />Actualizar</button></div>
    <div className="order-filters">{filters.map((item) => <button className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)} key={item.id}>{item.label}{item.id !== "all" && <span>{item.id === "active" ? pending : orders.filter((order) => order.status === item.id).length}</span>}</button>)}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading && !orders.length ? <div className="catalog-loading">Cargando pedidos...</div> : visible.length === 0 ? <section className="empty-orders orders-empty"><ShoppingBag size={30} /><h3>No hay pedidos en esta vista</h3><p>Los pedidos nuevos del menú público aparecerán automáticamente.</p></section> : <div className="orders-grid">{visible.map((order) => <OrderCard key={order.id} order={order} busy={updating === order.id} onAction={(payload) => action(payload, order.id)} />)}</div>}
    <p className="orders-refresh-note">Actualización automática cada 8 segundos{lastUpdate ? ` · Última: ${lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}</p>
  </div>;
}

function OrderCard({ order, busy, onAction }: { order: Order; busy: boolean; onAction: (payload: Record<string, unknown>) => void }) {
  const StatusIcon = statusInfo[order.status].icon;
  const next: Partial<Record<OrderStatus, OrderStatus>> = { received: "preparing", preparing: "ready", ready: "delivered" };
  return <article className={`order-card status-${order.status}`}>
    <header><div><span className="order-reference">{order.reference}</span><span className={`order-status ${order.status}`}><StatusIcon size={14} />{statusInfo[order.status].label}</span></div><time>{new Date(order.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></header>
    <div className="order-customer"><strong>{order.customerName}</strong><a href={`tel:${order.customerPhone}`}><Phone size={14} />{order.customerPhone}</a><span>{order.orderType === "delivery" ? <><Truck size={15} />Domicilio</> : <><ShoppingBag size={15} />Para llevar</>}</span>{order.deliveryAddress && <address><MapPin size={14} />{order.deliveryAddress}</address>}</div>
    <div className="order-lines">{order.items.map((item, index) => <div key={`${item.productName}-${index}`}><span><b>{item.quantity}x</b>{item.productName}</span><strong>{money(item.subtotalCop)}</strong></div>)}</div>
    {order.notes && <p className="order-notes">Nota: {order.notes}</p>}
    <div className="order-total"><span>Total</span><strong>{money(order.totalCop)}</strong></div>
    <footer><button className={order.paid ? "paid" : "payment-pending"} disabled={busy} onClick={() => onAction({ action: "togglePaid", id: order.id })}>{order.paid ? "Pagado" : "Marcar pagado"}</button>{next[order.status] && <button className="advance-order" disabled={busy} onClick={() => onAction({ action: "updateStatus", id: order.id, status: next[order.status] })}>{busy ? "Guardando..." : `Pasar a ${statusInfo[next[order.status]!].label}`}</button>}{!["delivered", "cancelled"].includes(order.status) && <button className="cancel-order" disabled={busy} onClick={() => { if (window.confirm(`¿Cancelar el pedido ${order.reference}?`)) onAction({ action: "updateStatus", id: order.id, status: "cancelled" }); }}>Cancelar</button>}</footer>
  </article>;
}
