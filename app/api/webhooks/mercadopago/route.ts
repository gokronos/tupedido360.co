import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { validateMercadoPagoSignature } from "@/lib/mercadopago-webhook";

type PaymentPayload = {
  id?: string | number;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({})) as { type?: string; data?: { id?: string | number } };
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? (body.data?.id !== undefined ? String(body.data.id) : null);
  const type = url.searchParams.get("type") ?? body.type;

  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, message: "Evento omitido." });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!accessToken || !webhookSecret) {
    console.error("Mercado Pago webhook is missing required credentials.");
    return NextResponse.json({ error: "Integración de pagos no configurada." }, { status: 503 });
  }

  if (!validateMercadoPagoSignature({
    dataId,
    requestId: request.headers.get("x-request-id"),
    signature: request.headers.get("x-signature"),
    secret: webhookSecret,
  })) {
    return NextResponse.json({ error: "Firma de webhook inválida." }, { status: 401 });
  }

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!paymentRes.ok) return NextResponse.json({ error: "Error consultando pago en Mercado Pago." }, { status: 502 });

  const payment = await paymentRes.json() as PaymentPayload;
  if (payment.status !== "approved" || !payment.external_reference) {
    return NextResponse.json({ ok: true, message: "Pago todavía no aprobado." });
  }
  if (!uuidPattern.test(payment.external_reference)) {
    return NextResponse.json({ error: "Referencia de pago inválida." }, { status: 422 });
  }
  const externalReference = payment.external_reference;

  const sql = await ensureSchema();
  const result = await sql.begin(async (transaction) => {
    const [checkout] = await transaction`
      SELECT id, business_id, months, amount_cop, status, provider_payment_id
      FROM subscription_checkouts
      WHERE id=${externalReference}
      FOR UPDATE`;
    if (!checkout) return "unknown";
    if (checkout.status === "processed") return "duplicate";
    if (String(payment.id) !== dataId || payment.currency_id !== "COP" || Number(payment.transaction_amount) !== Number(checkout.amount_cop)) {
      return "mismatch";
    }

    await transaction`
      UPDATE subscription_checkouts
      SET status='processed', provider_payment_id=${String(payment.id)}, processed_at=now(), updated_at=now()
      WHERE id=${checkout.id}`;
    await transaction`
      UPDATE subscriptions
      SET status='active', is_lifetime=false,
          current_period_ends_at=GREATEST(COALESCE(current_period_ends_at, trial_ends_at, now()), now()) + (${Number(checkout.months)} || ' months')::interval,
          updated_at=now()
      WHERE business_id=${checkout.business_id}`;
    await transaction`UPDATE businesses SET status='active', updated_at=now() WHERE id=${checkout.business_id}`;
    return "processed";
  });

  if (result === "unknown" || result === "mismatch") {
    console.error("Rejected Mercado Pago payment", { dataId, result });
    return NextResponse.json({ error: "El pago no coincide con un checkout válido." }, { status: 422 });
  }
  return NextResponse.json({ ok: true, result });
}
