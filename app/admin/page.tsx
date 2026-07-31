import { Building2, ExternalLink, LogOut, Store, Trash2, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";
import {PlatformOrders} from "@/components/platform-orders";

export default async function PlatformAdminPage() {
  const session = await currentSession();
  if (!session) redirect("/ingresar");
  if (session.platformRole !== "superadmin") {
    const destination = process.env.NODE_ENV === "production" ? `https://${session.businessSlug}.tupedido360.co/admin` : `/store/${session.businessSlug}/admin`;
    redirect(destination);
  }
  const sql = await ensureSchema();
  const businesses = await sql`
    SELECT b.name,b.slug,b.status,b.created_at AS "createdAt",s.status AS "subscriptionStatus",s.is_lifetime AS "isLifetime",
      s.trial_ends_at AS "trialEndsAt",COUNT(bm.user_id)::int AS members
    FROM businesses b JOIN subscriptions s ON s.business_id=b.id
    LEFT JOIN business_members bm ON bm.business_id=b.id AND bm.active=true
    GROUP BY b.id,s.id ORDER BY b.created_at DESC`;
  const deletions=await sql`SELECT l.id,l.order_reference AS reference,l.reason,l.deleted_by_name AS "deletedByName",l.deleted_by_role AS "deletedByRole",l.deleted_at AS "deletedAt",l.tenant_purged_at AS "tenantPurgedAt",b.name AS "businessName",b.slug AS "businessSlug",(l.order_snapshot->>'total_cop')::int AS "totalCop" FROM order_deletion_log l JOIN businesses b ON b.id=l.business_id ORDER BY l.deleted_at DESC LIMIT 100`;
  const activeOrders=await sql`SELECT o.id,o.reference,b.name AS "businessName",o.customer_name AS "customerName",o.total_cop AS "totalCop",o.created_at AS "createdAt" FROM orders o JOIN businesses b ON b.id=o.business_id WHERE o.deleted_at IS NULL AND o.status NOT IN ('delivered','cancelled') ORDER BY o.created_at DESC LIMIT 100`;
  const money=(value:number)=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(value);
  return <main className="platform-admin"><header><div><span><Building2 size={22}/></span><div><strong>TuPedido360</strong><small>Administración general</small></div></div><form action="/api/auth/logout" method="post"><button><LogOut size={18}/>Cerrar sesión</button></form></header><section><div className="platform-heading"><div><p>Imagen Plus</p><h1>Negocios registrados</h1></div><span><Store size={18}/>{businesses.length} negocios</span></div><div className="platform-businesses">{businesses.map((business)=><article key={String(business.slug)}><div className="platform-business-icon"><Store size={21}/></div><div><strong>{String(business.name)}</strong><span>{String(business.slug)}.tupedido360.co</span><small><Users size={13}/>{Number(business.members)} usuarios</small></div><div className="platform-business-state"><b>{business.isLifetime?"Vitalicia":business.subscriptionStatus==="trialing"?"Prueba":String(business.subscriptionStatus)}</b><span>{String(business.status)}</span></div><a href={`https://${String(business.slug)}.tupedido360.co/admin`} target="_blank" rel="noreferrer" title={`Abrir ${String(business.name)}`}><ExternalLink size={18}/></a></article>)}</div><div className="platform-heading platform-audit-heading"><div><p>Control general</p><h1>Pedidos activos</h1></div><span>{activeOrders.length} pedidos</span></div><PlatformOrders orders={activeOrders.map(order=>({id:String(order.id),reference:String(order.reference),businessName:String(order.businessName),customerName:String(order.customerName),totalCop:Number(order.totalCop),createdAt:String(order.createdAt)}))}/><div className="platform-heading platform-audit-heading"><div><p>Auditoría permanente</p><h1>Pedidos eliminados</h1></div><span><Trash2 size={18}/>{deletions.length} registros</span></div><div className="platform-audit">{deletions.map(item=><article key={String(item.id)}><div><strong>{String(item.reference)}</strong><span>{String(item.businessName)}</span></div><div><b>{String(item.reason)}</b><span>{String(item.deletedByName)} · {String(item.deletedByRole)}</span></div><div><strong>{money(Number(item.totalCop??0))}</strong><span>{new Date(String(item.deletedAt)).toLocaleString("es-CO")}</span>{item.tenantPurgedAt&&<small>Retirado también por el dueño</small>}</div></article>)}{!deletions.length&&<p className="sales-empty">Todavía no existen pedidos eliminados.</p>}</div></section></main>;
}
