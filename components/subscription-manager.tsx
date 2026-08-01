"use client";
import { CheckCircle2, CreditCard, Sparkles, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type Subscription = {
  status: string;
  isLifetime: boolean;
  monthlyPriceCop: number;
  trialEndsAt: string;
  currentPeriodEndsAt: string | null;
  businessName?: string;
  businessSlug?: string;
};

const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const plans = [
  { id: "1m", months: 1, name: "1 Mes", priceCop: 30000, discount: null, badge: "Estándar" },
  { id: "3m", months: 3, name: "3 Meses", priceCop: 80000, discount: "Ahorras $10.000", badge: "Popular" },
  { id: "6m", months: 6, name: "6 Meses", priceCop: 150000, discount: "Ahorras $30.000", badge: "Recomendado" },
  { id: "12m", months: 12, name: "1 Año", priceCop: 280000, discount: "Ahorras $80.000 · 2 meses gratis", badge: "Mejor Ahorro" },
];

export function SubscriptionManager() {
  const [data, setData] = useState<Subscription | null>(null);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [payError, setPayError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.ok) {
        const json = await response.json();
        setData({
          ...json.subscription,
          businessName: json.business?.name,
          businessSlug: json.business?.slug,
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!data) return <div className="catalog-loading">Cargando información de suscripción...</div>;
  const active = data.isLifetime || data.status === "active" || data.status === "trialing";

  async function payPlan(planId: string, planName: string, price: number) {
    setPayError("");
    setPayingPlan(planId);

    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const text = await res.text();
      let checkoutData: Record<string, unknown> = {};
      try {
        checkoutData = JSON.parse(text);
      } catch {
        checkoutData = { error: `Error del servidor (${res.status}): ${text.slice(0, 100)}` };
      }

      if (res.ok && checkoutData.initPoint) {
        setCheckoutUrl(String(checkoutData.initPoint));
        return;
      }

      if (checkoutData.setupRequired || res.status === 503) {
        // Fallback to WhatsApp if token not configured yet in Vercel
        const message = encodeURIComponent(`Hola TuPedido360, deseo activar el plan de suscripción *${planName}* (${money(price)}) para mi negocio *${data?.businessName || data?.businessSlug || "mi negocio"}* (${data?.businessSlug || "negocio"}.tupedido360.co).`);
        window.open(`https://wa.me/573138866453?text=${message}`, "_blank");
        return;
      }

      setPayError(String(checkoutData.error || checkoutData.message || "No fue posible iniciar el pago por Mercado Pago."));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error de conexión al iniciar el pago.";
      setPayError(errMsg);
    } finally {
      setPayingPlan(null);
    }
  }

  return (
    <div className="subscription-manager" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section>
        <div className="subscription-icon"><CreditCard size={27} /></div>
        <div>
          <small>PLAN DEL NEGOCIO</small>
          <h2>{data.isLifetime ? "Membresía Vitalicia" : data.status === "trialing" ? "Periodo de Prueba (30 Días Gratis)" : "Suscripción TuPedido360"}</h2>
          <p>{data.isLifetime ? "Acceso permanente sin vencimiento." : `Tarifa base: ${money(data.monthlyPriceCop)} / mes`}</p>
        </div>
        <span className={active ? "active" : "inactive"}>
          <CheckCircle2 size={16} />{active ? "Activo" : "Pendiente"}
        </span>
      </section>

      <div className="subscription-details">
        <div>
          <span>Estado</span>
          <strong>{data.isLifetime ? "Vitalicia" : data.status === "trialing" ? "Prueba Gratuita" : data.status === "active" ? "Al día" : "Pago pendiente"}</strong>
        </div>
        {!data.isLifetime && (
          <div>
            <span>{data.status === "trialing" ? "Prueba hasta" : "Suscripción activa hasta"}</span>
            <strong>{new Date(data.status === "trialing" ? data.trialEndsAt : data.currentPeriodEndsAt ?? data.trialEndsAt).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</strong>
          </div>
        )}
        <div>
          <span>Forma de cobro</span>
          <strong>{data.isLifetime ? "Sin mensualidades" : "1, 3, 6 o 12 Meses"}</strong>
        </div>
      </div>

      {!data.isLifetime && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={20} color="#d6f35c" /> Planes de Renovación Disponibles
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted, #94a3b8)", margin: "0.2rem 0 0 0" }}>
              Elige la duración de tu plan para renovar o activar tu negocio:
            </p>
          </div>

          {payError && <p className="form-error" style={{ marginBottom: "1rem" }}>{payError}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {plans.map((plan) => (
              <div key={plan.id} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "1.2rem", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "6px", backgroundColor: plan.months === 12 ? "rgba(214, 243, 92, 0.2)" : "rgba(255,255,255,0.1)", color: plan.months === 12 ? "#d6f35c" : "inherit" }}>
                      {plan.badge}
                    </span>
                    {plan.months === 12 && <Sparkles size={16} color="#d6f35c" />}
                  </div>
                  <strong style={{ fontSize: "1.2rem", display: "block" }}>{plan.name}</strong>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0.4rem 0" }}>{money(plan.priceCop)}</div>
                  {plan.discount && <small style={{ color: "#d6f35c", fontWeight: 600, fontSize: "0.82rem", display: "block" }}>{plan.discount}</small>}
                </div>
                <button
                  disabled={payingPlan === plan.id}
                  onClick={() => payPlan(plan.id, plan.name, plan.priceCop)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "none", backgroundColor: "#176b4d", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", opacity: payingPlan === plan.id ? 0.7 : 1 }}
                >
                  {payingPlan === plan.id ? "Cargando..." : `Renovar ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
          <p className="subscription-support" style={{ marginTop: "1rem" }}>
            Pagos procesados de forma 100% segura con Mercado Pago (PSE, Nequi, Tarjetas) o mediante activación directa de administración.
          </p>
        </div>
      )}

      {checkoutUrl && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onMouseDown={(e) => { if (e.target === e.currentTarget) setCheckoutUrl(null); }}>
          <div style={{ backgroundColor: "#1e293b", width: "94%", maxWidth: "820px", height: "90vh", maxHeight: "840px", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.25rem", background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <CreditCard size={19} color="#10b981" />
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Pago Seguro · Mercado Pago (PSE, Nequi, Tarjeta)</span>
              </div>
              <button onClick={() => setCheckoutUrl(null)} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
                <X size={18} />
              </button>
            </div>
            <iframe src={checkoutUrl} style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#fff" }} title="Mercado Pago Checkout" />
          </div>
        </div>
      )}
    </div>
  );
}
