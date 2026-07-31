import { Building2, ExternalLink, LogOut, Store, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

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
  return <main className="platform-admin"><header><div><span><Building2 size={22}/></span><div><strong>TuPedido360</strong><small>Administración general</small></div></div><form action="/api/auth/logout" method="post"><button><LogOut size={18}/>Cerrar sesión</button></form></header><section><div className="platform-heading"><div><p>Imagen Plus</p><h1>Negocios registrados</h1></div><span><Store size={18}/>{businesses.length} negocios</span></div><div className="platform-businesses">{businesses.map((business)=><article key={String(business.slug)}><div className="platform-business-icon"><Store size={21}/></div><div><strong>{String(business.name)}</strong><span>{String(business.slug)}.tupedido360.co</span><small><Users size={13}/>{Number(business.members)} usuarios</small></div><div className="platform-business-state"><b>{business.isLifetime?"Vitalicia":business.subscriptionStatus==="trialing"?"Prueba":String(business.subscriptionStatus)}</b><span>{String(business.status)}</span></div><a href={`https://${String(business.slug)}.tupedido360.co/admin`} target="_blank" rel="noreferrer" title={`Abrir ${String(business.name)}`}><ExternalLink size={18}/></a></article>)}</div></section></main>;
}
