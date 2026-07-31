"use client";
import { Clock3, ExternalLink, Infinity as InfinityIcon, PauseCircle, PlayCircle, Store, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
type Business = { id: string; name: string; slug: string; status: string; subscriptionStatus: string; isLifetime: boolean; trialEndsAt: string; members: number; orders: number; salesCop: number };
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export function PlatformBusinesses({ businesses }: { businesses: Business[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function action(business: Business, actionName: string, confirmation: string, extra: Record<string, unknown> = {}) {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(business.id);
    setError("");
    const response = await fetch("/api/admin/businesses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: business.id, action: actionName, ...extra }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error);
    else router.refresh();
    setBusy("");
  }

  return (
    <>
      {error && <p className="form-error">{error}</p>}
      <div className="platform-businesses">
        {businesses.map((business) => (
          <article key={business.id}>
            <div className="platform-business-icon"><Store size={21} /></div>
            <div>
              <strong>{business.name}</strong>
              <span>{business.slug}.tupedido360.co</span>
              <small><Users size={13} />{business.members} usuarios · {business.orders} pedidos · {money(business.salesCop)}</small>
            </div>
            <div className="platform-business-state">
              <b>{business.isLifetime ? "Vitalicia" : business.subscriptionStatus === "trialing" ? "Prueba" : business.subscriptionStatus}</b>
              <span>{business.status}{!business.isLifetime && business.subscriptionStatus === "trialing" ? ` · hasta ${new Date(business.trialEndsAt).toLocaleDateString("es-CO")}` : ""}</span>
            </div>
            <div className="platform-business-actions">
              <select
                disabled={busy === business.id}
                defaultValue=""
                onChange={(e) => {
                  const months = Number(e.target.value);
                  if (months) {
                    const label = months === 12 ? "1 año" : `${months} meses`;
                    action(business, "renewSubscription", `¿Activar plan de ${label} para ${business.name}?`, { months });
                    e.target.value = "";
                  }
                }}
                style={{ padding: "0.35rem 0.5rem", borderRadius: "6px", fontSize: "0.8rem", border: "1px solid rgba(255,255,255,0.15)", background: "var(--surface-color, #1e293b)", color: "inherit" }}
              >
                <option value="" disabled>+ Renovar plan</option>
                <option value="1">+1 Mes ($30.000)</option>
                <option value="3">+3 Meses ($80.000)</option>
                <option value="6">+6 Meses ($150.000)</option>
                <option value="12">+1 Año ($280.000)</option>
              </select>
              <button disabled={busy === business.id} onClick={() => action(business, "toggleLifetime", business.isLifetime ? `¿Quitar la membresía vitalicia de ${business.name}?` : `¿Dar membresía vitalicia a ${business.name}?`)} title={business.isLifetime ? "Quitar membresía vitalicia" : "Dar membresía vitalicia"}><InfinityIcon size={17} /></button>
              <button disabled={busy === business.id} onClick={() => action(business, "extendTrial", `¿Extender 30 días la prueba de ${business.name}?`)} title="Extender prueba 30 días"><Clock3 size={17} /></button>
              <button disabled={busy === business.id} onClick={() => action(business, "toggleSuspended", business.status === "suspended" ? `¿Reactivar ${business.name}?` : `¿Suspender ${business.name}?`)} title={business.status === "suspended" ? "Reactivar negocio" : "Suspender negocio"}>{business.status === "suspended" ? <PlayCircle size={17} /> : <PauseCircle size={17} /></button>
              <a href={`https://${business.slug}.tupedido360.co`} target="_blank" rel="noreferrer" title="Abrir menú público"><ExternalLink size={17} /></a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
