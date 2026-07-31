import { Bell, Boxes, ChefHat, ClipboardList, CreditCard, ExternalLink, LayoutDashboard, LogOut, Store, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { currentSession } from "@/lib/session";

const navigation = [
  { label: "Resumen", icon: LayoutDashboard, active: true },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Productos", icon: Boxes },
  { label: "Mesas", icon: Store },
  { label: "Equipo", icon: Users },
  { label: "Cocina", icon: ChefHat },
];

export default async function PanelPage() {
  const session = await currentSession();
  if (!session) redirect("/ingresar");

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><span><Store size={20} /></span><div>TuPedido360<small>{session.businessName}</small></div></div>
        <nav>{navigation.map(({ label, icon: Icon, active }) => <button className={active ? "active" : ""} key={label}><Icon size={19} />{label}</button>)}</nav>
        <form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={19} />Cerrar sesión</button></form>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div><p>Panel del negocio</p><h1>Buenos días, {session.name}</h1></div>
          <button className="icon-button" title="Notificaciones" aria-label="Notificaciones"><Bell size={20} /></button>
        </header>
        <div className="trial-banner"><div><CreditCard size={21} /><span><strong>Periodo de prueba activo</strong><small>Te quedan 30 días sin costo.</small></span></div><button>Ver suscripción</button></div>
        <div className="panel-section-title"><div><h2>Resumen de hoy</h2><p>La actividad de tu negocio aparecerá aquí.</p></div><a href={`https://${session.businessSlug}.tupedido360.co`} target="_blank" rel="noreferrer">Ver tienda <ExternalLink size={16} /></a></div>
        <div className="metric-grid">
          <article><span>Pedidos</span><strong>0</strong><small>Sin pedidos nuevos</small></article>
          <article><span>Ventas</span><strong>$0</strong><small>Total del día</small></article>
          <article><span>En preparación</span><strong>0</strong><small>Cocina al día</small></article>
          <article><span>Productos activos</span><strong>0</strong><small>Agrega tu primer producto</small></article>
        </div>
        <section className="empty-orders"><ClipboardList size={30} /><h3>Todavía no hay pedidos</h3><p>Cuando registres pedidos de mesa, domicilio o para llevar, los verás en este espacio.</p><button>Crear primer producto</button></section>
      </section>
    </main>
  );
}
