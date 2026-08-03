import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { playAppCookie } from "@/lib/play-app";
import { randomUUID } from "node:crypto";
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
    if ((await cookies()).get(playAppCookie.name)?.value === playAppCookie.value) {
      return NextResponse.json({ error: "Las compras no están disponibles en la aplicación de Google Play." }, { status: 403 });
    }
    const session = await currentSession();
    if (!session?.userId || !session.businessId) {
      return NextResponse.json({ error: "No autenticado. Por favor inicia sesión nuevamente." }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as { planId?: string } | null;
    const plan = body?.planId ? PLAN_MAP[body.planId] : null;

    if (!plan) {
      return NextResponse.json({ error: "Plan de suscripción no válido." }, { status: 400 });
    }

    const sql = await ensureSchema();
    const userId = session.userId;
    const businessId = session.businessId;

    const [membership] = await sql`
      SELECT b.id, b.name, b.slug, u.email
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN users u ON u.id = bm.user_id
      WHERE bm.user_id = ${userId} AND bm.business_id = ${businessId}
        AND bm.active = true AND bm.role IN ('owner', 'admin')
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

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const baseUrl = configuredUrl
      ? configuredUrl.replace(/\/$/, "")
      : process.env.NODE_ENV === "production"
        ? "https://tupedido360.co"
        : new URL(request.url).origin;
    const checkoutId = randomUUID();

    await sql`
      INSERT INTO subscription_checkouts (id, business_id, created_by_user_id, months, amount_cop)
      VALUES (${checkoutId}, ${membership.id}, ${userId}, ${plan.months}, ${plan.priceCop})`;

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
      external_reference: checkoutId,
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

    const data = await response.json().catch(() => ({})) as {
      id?: string | number;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      await sql`UPDATE subscription_checkouts SET status='failed', updated_at=now() WHERE id=${checkoutId}`;
      console.error("[MercadoPago API Error]", response.status, data);
      const isAuthError = response.status === 401 || response.status === 403 || String(data.message).toLowerCase().includes("token");
      return NextResponse.json({
        error: data.message ?? data.error ?? "Mercado Pago no pudo procesar la solicitud. Revisa el Access Token.",
        setupRequired: isAuthError,
      }, { status: 400 });
    }

    if (typeof data.id === "string" || typeof data.id === "number") {
      await sql`UPDATE subscription_checkouts SET provider_preference_id=${String(data.id)}, updated_at=now() WHERE id=${checkoutId}`;
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
