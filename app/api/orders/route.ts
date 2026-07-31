import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

const statuses = new Set(["received", "preparing", "ready", "delivered", "cancelled"]);

async function context() {
  const session = await currentSession();
  if (!session?.businessId) return null;
  return { businessId: session.businessId, sql: await ensureSchema() };
}

export async function GET() {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  const orders = await auth.sql`
    SELECT id, reference, order_type AS "orderType", customer_name AS "customerName",
      customer_phone AS "customerPhone", delivery_address AS "deliveryAddress", notes,
      status, paid, total_cop AS "totalCop", created_at AS "createdAt"
    FROM orders WHERE business_id=${auth.businessId}
    ORDER BY created_at DESC LIMIT 100`;
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
  const body = await request.json().catch(() => null) as { action?: string; id?: string; status?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  if (body.action === "updateStatus" && body.status && statuses.has(body.status)) {
    const [order] = await auth.sql`
      UPDATE orders SET status=${body.status}, updated_at=now()
      WHERE id=${body.id} AND business_id=${auth.businessId}
      RETURNING id, status`;
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    return NextResponse.json({ order });
  }
  if (body.action === "togglePaid") {
    const [order] = await auth.sql`
      UPDATE orders SET paid=NOT paid, updated_at=now()
      WHERE id=${body.id} AND business_id=${auth.businessId}
      RETURNING id, paid`;
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    return NextResponse.json({ order });
  }
  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
