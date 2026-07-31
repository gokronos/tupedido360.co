import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

const PLAN_MAP: Record<string, { months: number; name: string; priceCop: number }> = {
  "1m": { months: 1, name: "Plan 1 Mes - TuPedido360", priceCop: 30000 },
  "3m": { months: 3, name: "Plan 3 Meses - TuPedido360", priceCop: 80000 },
  "6m": { months: 6, name: "Plan 6 Meses - TuPedido360", priceCop: 150000 },
  "12m": { months: 12, name: "Plan 1 Año - TuPedido360", priceCop: 280000 },
};

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "No autenticado. Por favor inicia sesión nuevamente." }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as { planId?: string } | null;
    const plan = body?.planId ? PLAN_MAP[body.planId] : null;

    if (!plan) {
      return NextResponse.json({ error: "Plan de suscripción no válido." }, { status: 400 });
    }

    const sql = await ensureSchema();
    const userId = session.userId;

    const [membership] = await sql`
      SELECT b.id, b.name, b.slug, u.email
      FROM business_memberships bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN users u ON u.id = bm.user_id
      WHERE bm.user_id = ${userId}
      LIMIT 1
    `;

    if (!membership) {
      return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      return NextResponse.json({
        error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN en las variables de entorno.",
        setupRequired: true,
      }, { status: 503 });
    }

    const host = request.headers.get("host") ?? "tupedido360.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const preference = {
      items: [
        {
          id: body!.planId,
          title: plan.name,
          description: `Suscripción ${plan.name} para ${membership.name}`,
          quantity: 1,
          currency_id: "COP",
          unit_price: plan.priceCop,
        },
      ],
      payer: {
        email: membership.email,
      },
      external_reference: `${membership.id}:${plan.months}:${Date.now()}`,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${baseUrl}/panel?payment=success`,
        failure: `${baseUrl}/panel?payment=failure`,
        pending: `${baseUrl}/panel?payment=pending`,
      },
      auto_return: "approved",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[MercadoPago API Error]", response.status, data);
      const isAuthError = response.status === 401 || response.status === 403 || String(data.message).toLowerCase().includes("token");
      return NextResponse.json({
        error: data.message ?? data.error ?? "Mercado Pago no pudo procesar la solicitud. Revisa el Access Token.",
        setupRequired: isAuthError,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    });
  } catch (err: unknown) {
    console.error("[Checkout POST Error]", err);
    const errMsg = err instanceof Error ? err.message : "Error procesando la solicitud de pago.";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
