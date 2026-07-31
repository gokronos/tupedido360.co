"use client";

import { BarChart3, Bell, Boxes, ChefHat, ClipboardList, CreditCard, ExternalLink, LayoutDashboard, LogOut, Settings, Store, Users } from "lucide-react";
import { useState } from "react";
import type { AppSession } from "@/lib/session";
import { ProductManager } from "@/components/product-manager";
import { OrdersManager } from "@/components/orders-manager";
import { TeamManager } from "@/components/team-manager";
import { TablesManager } from "@/components/tables-manager";
import { WaiterDashboard } from "@/components/waiter-dashboard";
import { SettingsManager } from "@/components/settings-manager";
import { SalesHistory } from "@/components/sales-history";

const navigation = [
  { id: "summary", label: "Resumen", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "sales", label: "Historial y ventas", icon: BarChart3 },
  { id: "products", label: "Productos", icon: Boxes },
  { id: "tables", label: "Mesas", icon: Store },
  { id: "team", label: "Equipo", icon: Users },
  { id: "kitchen", label: "Cocina", icon: ChefHat },
  { id: "settings", label: "Configuración", icon: Settings },
];

export function BusinessDashboard({ session }: { session: AppSession }) {
  const [section, setSection] = useState("summary");
  if (session.role === "waiter") return <WaiterDashboard session={session} />;
  const visibleNavigation = navigation.filter((item) => item.id !== "sales" || ["owner","admin","cashier"].includes(session.role ?? ""));

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><span><Store size={20} /></span><div>TuPedido360<small>{session.businessName}</small></div></div>
        <nav>{visibleNavigation.map(({ id, label, icon: Icon }) => <button className={section === id ? "active" : ""} onClick={() => setSection(id)} key={id} title={label}><Icon size={19} />{label}</button>)}</nav>
        <form action="/api/auth/logout" method="post"><button className="logout-button" title="Cerrar sesión"><LogOut size={19} />Cerrar sesión</button></form>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div><p>{session.role === "owner" ? "Panel del dueño" : "Panel del administrador"}</p><h1>{section === "products" ? "Productos" : section === "orders" ? "Pedidos" : section === "sales" ? "Historial y ventas" : section === "tables" ? "Mesas" : section === "team" ? "Equipo" : section === "settings" ? "Configuración" : `Buenos días, ${session.name}`}</h1></div>
          <button className="icon-button" title="Notificaciones" aria-label="Notificaciones"><Bell size={20} /></button>
        </header>
        {section === "summary" && <Summary session={session} onProducts={() => setSection("products")} />}
        {section === "orders" && <OrdersManager />}
        {section === "sales" && <SalesHistory />}
        {section === "products" && <ProductManager />}
        {section === "tables" && <TablesManager />}
        {section === "team" && <TeamManager />}
        {section === "settings" && <SettingsManager />}
        {!['summary', 'orders', 'sales', 'products', 'tables', 'team', 'settings'].includes(section) && <PendingSection name={navigation.find((item) => item.id === section)?.label ?? "Sección"} />}
      </section>
    </main>
  );
}

function Summary({ session, onProducts }: { session: AppSession; onProducts: () => void }) {
  return <>
    <div className="trial-banner"><div><CreditCard size={21} /><span><strong>Periodo de prueba activo</strong><small>Tu primer mes no tiene costo.</small></span></div><button>Ver suscripción</button></div>
    <div className="panel-section-title"><div><h2>Resumen de hoy</h2><p>La actividad de tu negocio aparecerá aquí.</p></div><a href={`https://${session.businessSlug}.tupedido360.co`} target="_blank" rel="noreferrer">Ver tienda <ExternalLink size={16} /></a></div>
    <div className="metric-grid">
      <article><span>Pedidos</span><strong>0</strong><small>Sin pedidos nuevos</small></article>
      <article><span>Ventas</span><strong>$0</strong><small>Total del día</small></article>
      <article><span>En preparación</span><strong>0</strong><small>Cocina al día</small></article>
      <article><span>Productos activos</span><strong>0</strong><small>Configura tu catálogo</small></article>
    </div>
    <section className="empty-orders"><ClipboardList size={30} /><h3>Todavía no hay pedidos</h3><p>Comienza agregando los productos que ofrecerá tu negocio.</p><button onClick={onProducts}>Crear primer producto</button></section>
  </>;
}

function PendingSection({ name }: { name: string }) {
  return <section className="empty-orders"><Store size={30} /><h3>{name}</h3><p>Esta sección será el siguiente módulo que construiremos.</p></section>;
}
