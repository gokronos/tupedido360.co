"use client";

import { BarChart3, Bell, Boxes, ChefHat, ClipboardList, CreditCard, ExternalLink, LayoutDashboard, LogOut, Palette, Settings, Store, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppSession } from "@/lib/session";
import { ProductManager } from "@/components/product-manager";
import { OrdersManager } from "@/components/orders-manager";
import { TeamManager } from "@/components/team-manager";
import { TablesManager } from "@/components/tables-manager";
import { WaiterDashboard } from "@/components/waiter-dashboard";
import { SettingsManager } from "@/components/settings-manager";
import { SalesHistory } from "@/components/sales-history";
import { DesignManager } from "@/components/design-manager";
import { SubscriptionManager } from "@/components/subscription-manager";
import { PushNotificationRegistrar } from "@/components/push-notification-registrar";

const navigation = [
  { id: "summary", label: "Resumen", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "sales", label: "Historial y ventas", icon: BarChart3 },
  { id: "products", label: "Productos", icon: Boxes },
  { id: "tables", label: "Mesas", icon: Store },
  { id: "team", label: "Equipo", icon: Users },
  { id: "kitchen", label: "Cocina", icon: ChefHat },
  { id: "design", label: "Diseño", icon: Palette },
  { id: "subscription", label: "Suscripción", icon: CreditCard },
  { id: "settings", label: "Configuración", icon: Settings },
];

export function BusinessDashboard({ session, playApp = false }: { session: AppSession; playApp?: boolean }) {
  const [section, setSection] = useState(session.role==="kitchen"?"kitchen":"summary");
  if (session.role === "waiter") return <WaiterDashboard session={session} />;
  const allowed:Record<string,string[]>={owner:["summary","orders","sales","products","tables","team","kitchen","design","subscription","settings"],admin:["summary","orders","sales","products","tables","team","kitchen","design","settings"],cashier:["summary","orders","sales","settings"],kitchen:["kitchen","settings"]};
  const visibleNavigation = navigation.filter(item=>(allowed[session.role??""]??[]).includes(item.id) && (!playApp || item.id !== "subscription"));

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><span><Store size={20} /></span><div>TuPedido360<small>{session.businessName}</small></div></div>
        <nav>{visibleNavigation.map(({ id, label, icon: Icon }) => <button className={section === id ? "active" : ""} onClick={() => setSection(id)} key={id} title={label}><Icon size={19} />{label}</button>)}</nav>
        <form action="/api/auth/logout" method="post"><button className="logout-button" title="Cerrar sesión"><LogOut size={19} />Cerrar sesión</button></form>
      </aside>
      <section className="dashboard-main">
        <div className="mobile-brand-bar">
          <div className="dashboard-brand" style={{ padding: 0, margin: 0 }}>
            <span><Store size={20} /></span>
            <div>TuPedido360<small style={{ color: "#b8cbc2", fontSize: "11px" }}>{session.businessName}</small></div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="logout-button" title="Cerrar sesión" style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
              <LogOut size={16} />
            </button>
          </form>
        </div>
        <header className="dashboard-header">
          <div><p>{session.role === "owner" ? "Panel del dueño" : session.role==="kitchen"?"Panel de cocina":"Panel del administrador"}</p><h1>{section === "products" ? "Productos" : section === "orders" ? "Pedidos" : section === "sales" ? "Historial y ventas" : section === "tables" ? "Mesas" : section === "team" ? "Equipo" : section === "design" ? "Diseño" : section==="subscription"?"Suscripción":section==="kitchen"?"Cocina" : section === "settings" ? "Configuración" : `Buenos días, ${session.name}`}</h1></div>
          <button className="icon-button" title="Notificaciones" aria-label="Notificaciones"><Bell size={20} /></button>
        </header>
        {section === "summary" && <Summary session={session} onProducts={() => setSection("products")} onSettings={()=>setSection("subscription")} playApp={playApp} />}
        {section === "orders" && <OrdersManager role={session.role} />}
        {section === "kitchen" && <OrdersManager role={session.role} />}
        {section === "sales" && <SalesHistory />}
        {section === "products" && <ProductManager />}
        {section === "tables" && <TablesManager />}
        {section === "team" && <TeamManager />}
        {section === "design" && <DesignManager slug={session.businessSlug ?? ""} />}
        {section === "subscription"&&!playApp&&<SubscriptionManager/>}
        {section === "settings" && <SettingsManager />}
        {!['summary', 'orders', 'sales', 'products', 'tables', 'team', 'kitchen', 'design','subscription', 'settings'].includes(section) && <PendingSection name={navigation.find((item) => item.id === section)?.label ?? "Sección"} />}
      </section>
    </main>
  );
}

function Summary({ session, onProducts,onSettings,playApp }: { session: AppSession; onProducts: () => void;onSettings:()=>void;playApp:boolean }) {
  const[data,setData]=useState<{metrics:{ordersToday:number;salesToday:number;activeOrders:number;activeProducts:number};subscription:{status:string;isLifetime:boolean;monthlyPriceCop:number;trialEndsAt:string}}|null>(null);
  useEffect(()=>{const timer=setTimeout(async()=>{const response=await fetch("/api/dashboard",{cache:"no-store"});if(response.ok)setData(await response.json())},0);return()=>clearTimeout(timer)},[]);
  const money=(value:number)=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(value);
  const metrics=data?.metrics;
  return <>
    <PushNotificationRegistrar />
    <div className="trial-banner"><div><CreditCard size={21} /><span><strong>{data?.subscription?.isLifetime?"Acceso permanente":data?.subscription?.status==="trialing"?"Periodo de prueba activo":playApp?"Estado de acceso":"Suscripción mensual"}</strong><small>{data?.subscription?.isLifetime?"Su cuenta está activa.":data?.subscription?.status==="trialing"?`La prueba gratuita finaliza el ${new Date(data.subscription.trialEndsAt).toLocaleDateString("es-CO")}`:playApp?"Consulte aquí el estado de su cuenta.":`Plan de ${money(data?.subscription?.monthlyPriceCop??30000)} al mes`}</small></span></div>{!playApp&&<button onClick={onSettings}>Ver suscripción</button>}</div>
    <div className="panel-section-title"><div><h2>Resumen de hoy</h2><p>La actividad de tu negocio aparecerá aquí.</p></div><a href={`https://${session.businessSlug}.tupedido360.co`} target="_blank" rel="noreferrer">Ver tienda <ExternalLink size={16} /></a></div>
    <div className="metric-grid">
      <article><span>Pedidos</span><strong>{metrics?.ordersToday??"..."}</strong><small>Recibidos hoy</small></article>
      <article><span>Ventas</span><strong>{metrics?money(metrics.salesToday):"..."}</strong><small>Total del día</small></article>
      <article><span>En proceso</span><strong>{metrics?.activeOrders??"..."}</strong><small>Pedidos activos</small></article>
      <article><span>Productos activos</span><strong>{metrics?.activeProducts??"..."}</strong><small>Disponibles en el menú</small></article>
    </div>
    {metrics?.activeProducts===0&&<section className="empty-orders"><ClipboardList size={30} /><h3>Todavía no hay productos</h3><p>Comienza agregando los productos que ofrecerá tu negocio.</p><button onClick={onProducts}>Crear primer producto</button></section>}
  </>;
}

function PendingSection({ name }: { name: string }) {
  return <section className="empty-orders"><Store size={30} /><h3>{name}</h3><p>Esta sección será el siguiente módulo que construiremos.</p></section>;
}
