import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

const statuses = new Set(["received", "accepted", "preparing", "ready", "on_way", "delivered", "cancelled"]);
const paymentStatuses = new Set(["pending", "pending_verification", "verified"]);

async function context() {
  const session = await currentSession();
  if (!session?.businessId) return null;
  return { businessId: session.businessId, role: session.role, sql: await ensureSchema() };
}

export async function GET() {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  const orders = await auth.sql`
    SELECT o.id, o.reference, o.order_type AS "orderType", o.customer_name AS "customerName",
      o.customer_phone AS "customerPhone", o.delivery_address AS "deliveryAddress", o.notes,
      o.neighborhood, o.address_reference AS "addressReference", o.payment_method AS "paymentMethod",
      o.payment_status AS "paymentStatus", o.delivery_fee_cop AS "deliveryFeeCop", o.delivery_quote_status AS "deliveryQuoteStatus",
      o.estimated_minutes AS "estimatedMinutes", o.status, o.paid, o.total_cop AS "totalCop",
      o.packaging_total_cop AS "packagingTotalCop", o.created_at AS "createdAt", o.updated_at AS "updatedAt",
      t.name AS "tableName", u.name AS "createdByName"
    FROM orders o
    LEFT JOIN restaurant_tables t ON t.id=o.table_id
    LEFT JOIN users u ON u.id=o.created_by_user_id
    WHERE o.business_id=${auth.businessId}
    ORDER BY o.created_at DESC LIMIT 100`;
  if (!orders.length) return NextResponse.json({ orders: [] });
  const orderIds = orders.map((order) => order.id);
  const items = await auth.sql`
    SELECT order_id AS "orderId", product_name AS "productName", unit_price_cop AS "unitPriceCop",
      quantity, subtotal_cop AS "subtotalCop"
    FROM order_items WHERE order_id IN ${auth.sql(orderIds)} ORDER BY id`;
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const item of items) {
    const id = String(item.orderId);
    grouped.set(id, [...(grouped.get(id) ?? []), item]);
  }
  return NextResponse.json({ orders: orders.map((order) => ({ ...order, items: grouped.get(String(order.id)) ?? [] })) });
}

export async function POST(request: Request) {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: string; id?: string; status?: string; feeCop?: number; estimatedMinutes?: number } | null;
  if (!body?.id) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  if (body.action === "updateStatus" && body.status && statuses.has(body.status)) {
    if (!auth.role || !["owner", "admin", "kitchen"].includes(auth.role)) return NextResponse.json({ error: "No tienes permiso para cambiar el estado." }, { status: 403 });
    const [order] = await auth.sql`
      UPDATE orders SET status=${body.status}, updated_at=now()
      WHERE id=${body.id} AND business_id=${auth.businessId}
      RETURNING id, status`;
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    return NextResponse.json({ order });
  }
  if (body.action === "togglePaid") {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role)) return NextResponse.json({ error: "No tienes permiso para registrar pagos." }, { status: 403 });
    const [order] = await auth.sql`
      UPDATE orders SET paid=NOT paid, payment_status=CASE WHEN paid THEN 'pending' ELSE 'verified' END, updated_at=now()
      WHERE id=${body.id} AND business_id=${auth.businessId}
      RETURNING id, paid`;
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    return NextResponse.json({ order });
  }
  if (body.action === "updatePaymentStatus" && body.status && paymentStatuses.has(body.status)) {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role)) return NextResponse.json({ error: "No tienes permiso para registrar pagos." }, { status: 403 });
    const [order] = await auth.sql`UPDATE orders SET payment_status=${body.status},paid=${body.status === "verified"},updated_at=now() WHERE id=${body.id} AND business_id=${auth.businessId} RETURNING id,payment_status AS "paymentStatus",paid`;
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    return NextResponse.json({ order });
  }
  if (body.action === "quoteDelivery") {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role)) return NextResponse.json({ error: "No tienes permiso para cotizar domicilios." }, { status: 403 });
    const feeCop = Math.round(Number(body.feeCop));
    const estimatedMinutes = Math.round(Number(body.estimatedMinutes));
    if (!Number.isInteger(feeCop) || feeCop < 0 || !Number.isInteger(estimatedMinutes) || estimatedMinutes < 5 || estimatedMinutes > 240) return NextResponse.json({ error: "Revisa el valor y el tiempo del domicilio." }, { status: 400 });
    const [order] = await auth.sql`UPDATE orders SET total_cop=total_cop-COALESCE(delivery_fee_cop,0)+${feeCop},delivery_fee_cop=${feeCop},estimated_minutes=${estimatedMinutes},delivery_quote_status='quoted',updated_at=now() WHERE id=${body.id} AND business_id=${auth.businessId} AND order_type='delivery' RETURNING id,total_cop AS "totalCop"`;
    if (!order) return NextResponse.json({ error: "Domicilio no encontrado." }, { status: 404 });
    return NextResponse.json({ order });
  }
  if (body.action === "confirmDelivery") {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role)) return NextResponse.json({ error: "No tienes permiso para confirmar domicilios." }, { status: 403 });
    const [order] = await auth.sql`UPDATE orders SET delivery_quote_status='confirmed',status='accepted',updated_at=now() WHERE id=${body.id} AND business_id=${auth.businessId} AND order_type='delivery' AND delivery_fee_cop IS NOT NULL RETURNING id`;
    if (!order) return NextResponse.json({ error: "Primero debes cotizar el domicilio." }, { status: 409 });
    return NextResponse.json({ order });
  }
  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
