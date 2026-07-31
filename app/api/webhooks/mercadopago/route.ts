import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";

export async function POST(request: Request) {
  return handleWebhook(request);
}

export async function GET(request: Request) {
  return handleWebhook(request);
}

async function handleWebhook(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({})) as { type?: string; data?: { id?: string } };

  const dataId = url.searchParams.get("data.id") || url.searchParams.get("id") || body?.data?.id;
  const type = url.searchParams.get("type") || url.searchParams.get("topic") || body?.type;

  if (type !== "payment" || !dataId) {
    return NextResponse.json({ ok: true, message: "Evento omitido." });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Falta MERCADOPAGO_ACCESS_TOKEN." }, { status: 500 });
  }

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!paymentRes.ok) {
    return NextResponse.json({ error: "Error consultando pago en Mercado Pago." }, { status: 500 });
  }

  const payment = await paymentRes.json();

  if (payment.status === "approved" && payment.external_reference) {
    const parts = String(payment.external_reference).split(":");
    const businessId = parts[0];
    const months = Number(parts[1]);

    if (businessId && months && [1, 3, 6, 12].includes(months)) {
      const sql = await ensureSchema();

      await sql`
        UPDATE subscriptions
        SET status='active',
            is_lifetime=false,
            current_period_ends_at = GREATEST(COALESCE(current_period_ends_at, trial_ends_at, now()), now()) + (${months} || ' months')::interval,
            updated_at=now()
        WHERE business_id=${businessId}
      `;

      await sql`
        UPDATE businesses
        SET status='active',
            updated_at=now()
        WHERE id=${businessId}
      `;
    }
  }

  return NextResponse.json({ ok: true });
}
