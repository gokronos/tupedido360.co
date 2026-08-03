import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";
import { canTransition } from "@/lib/order-rules";

const statuses = new Set([
  "received",
  "accepted",
  "preparing",
  "ready",
  "on_way",
  "delivered",
  "cancelled",
]);
const paymentStatuses = new Set([
  "pending",
  "pending_verification",
  "verified",
]);

async function context() {
  const session = await currentSession();
  if (!session?.businessId) return null;
  return {
    businessId: session.businessId,
    userId: session.userId,
    userName: session.name,
    role: session.role,
    sql: await ensureSchema(),
  };
}

export async function GET(request: Request) {
  const auth = await context();
  if (!auth)
    return NextResponse.json(
      { error: "Sesión no autorizada." },
      { status: 401 },
    );
  if (new URL(request.url).searchParams.get("view") === "deleted") {
    if (auth.role !== "owner")
      return NextResponse.json(
        { error: "Solo el dueño puede revisar pedidos eliminados." },
        { status: 403 },
      );
    const deletedOrders =
      await auth.sql`SELECT id,order_reference AS reference,reason,deleted_by_name AS "deletedByName",deleted_by_role AS "deletedByRole",deleted_at AS "deletedAt",order_snapshot AS snapshot FROM order_deletion_log WHERE business_id=${auth.businessId} AND tenant_purged_at IS NULL ORDER BY deleted_at DESC LIMIT 100`;
    return NextResponse.json({ deletedOrders });
  }
  const orders = await auth.sql`
    SELECT o.id, o.reference, o.order_type AS "orderType", o.customer_name AS "customerName",
      o.customer_phone AS "customerPhone", o.delivery_address AS "deliveryAddress", o.notes,
      o.neighborhood, o.address_reference AS "addressReference", o.payment_method AS "paymentMethod",
      o.payment_status AS "paymentStatus", o.delivery_fee_cop AS "deliveryFeeCop", o.delivery_quote_status AS "deliveryQuoteStatus",
      o.estimated_minutes AS "estimatedMinutes", o.status, o.paid, o.total_cop AS "totalCop",
      o.packaging_total_cop AS "packagingTotalCop", o.created_at AS "createdAt", o.updated_at AS "updatedAt",
      o.table_id AS "tableId", t.name AS "tableName", u.name AS "createdByName"
    FROM orders o
    LEFT JOIN restaurant_tables t ON t.id=o.table_id
    LEFT JOIN users u ON u.id=o.created_by_user_id
    WHERE o.business_id=${auth.businessId} AND o.deleted_at IS NULL
    ORDER BY o.created_at DESC LIMIT 100`;
  if (!orders.length) return NextResponse.json({ orders: [] });
  const orderIds = orders.map((order) => order.id);
  const items = await auth.sql`
    SELECT order_id AS "orderId", product_name AS "productName", unit_price_cop AS "unitPriceCop",
      quantity, subtotal_cop AS "subtotalCop", added_at AS "addedAt", addition_round AS "additionRound"
    FROM order_items WHERE order_id IN ${auth.sql(orderIds)} ORDER BY id`;
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const item of items) {
    const id = String(item.orderId);
    grouped.set(id, [...(grouped.get(id) ?? []), item]);
  }
  return NextResponse.json({
    orders: orders.map((order) => ({
      ...order,
      items: grouped.get(String(order.id)) ?? [],
    })),
  });
}

export async function POST(request: Request) {
  const auth = await context();
  if (!auth)
    return NextResponse.json(
      { error: "Sesión no autorizada." },
      { status: 401 },
    );
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    id?: string;
    status?: string;
    feeCop?: number;
    estimatedMinutes?: number;
    reason?: string;
  } | null;
  if (!body?.id)
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  if (
    body.action === "updateStatus" &&
    body.status &&
    statuses.has(body.status)
  ) {
    if (!auth.role || !["owner", "admin", "kitchen"].includes(auth.role))
      return NextResponse.json(
        { error: "No tienes permiso para cambiar el estado." },
        { status: 403 },
      );
    const [current] =
      await auth.sql`SELECT status,paid,order_type FROM orders WHERE id=${body.id} AND business_id=${auth.businessId} AND deleted_at IS NULL`;
    if (!current)
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 },
      );
    if (
      !canTransition(
        String(current.status),
        body.status,
        String(current.order_type),
        Boolean(current.paid),
      )
    )
      return NextResponse.json(
        {
          error:
            body.status === "delivered" && !current.paid
              ? "Registra el pago antes de entregar el pedido."
              : `No puedes pasar de ${current.status} a ${body.status}.`,
        },
        { status: 409 },
      );
    const [order] = await auth.sql`
      UPDATE orders SET status=${body.status}, updated_at=now()
      WHERE id=${body.id} AND business_id=${auth.businessId} AND deleted_at IS NULL
      RETURNING id, status`;
    if (!order)
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 },
      );
    return NextResponse.json({ order });
  }
  if (body.action === "togglePaid") {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role))
      return NextResponse.json(
        { error: "No tienes permiso para registrar pagos." },
        { status: 403 },
      );
    const [order] = await auth.sql`
      UPDATE orders SET paid=NOT paid, payment_status=CASE WHEN paid THEN 'pending' ELSE 'verified' END, updated_at=now()
      WHERE id=${body.id} AND business_id=${auth.businessId} AND deleted_at IS NULL
      RETURNING id, paid`;
    if (!order)
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 },
      );
    return NextResponse.json({ order });
  }
  if (
    body.action === "updatePaymentStatus" &&
    body.status &&
    paymentStatuses.has(body.status)
  ) {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role))
      return NextResponse.json(
        { error: "No tienes permiso para registrar pagos." },
        { status: 403 },
      );
    const [order] =
      await auth.sql`UPDATE orders SET payment_status=${body.status},paid=${body.status === "verified"},updated_at=now() WHERE id=${body.id} AND business_id=${auth.businessId} AND deleted_at IS NULL RETURNING id,payment_status AS "paymentStatus",paid`;
    if (!order)
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 },
      );
    return NextResponse.json({ order });
  }
  if (body.action === "quoteDelivery") {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role))
      return NextResponse.json(
        { error: "No tienes permiso para cotizar domicilios." },
        { status: 403 },
      );
    const feeCop = Math.round(Number(body.feeCop));
    const estimatedMinutes = Math.round(Number(body.estimatedMinutes));
    if (
      !Number.isInteger(feeCop) ||
      feeCop < 0 ||
      !Number.isInteger(estimatedMinutes) ||
      estimatedMinutes < 5 ||
      estimatedMinutes > 240
    )
      return NextResponse.json(
        { error: "Revisa el valor y el tiempo del domicilio." },
        { status: 400 },
      );
    const [order] =
      await auth.sql`UPDATE orders SET total_cop=total_cop-COALESCE(delivery_fee_cop,0)+${feeCop},delivery_fee_cop=${feeCop},estimated_minutes=${estimatedMinutes},delivery_quote_status='quoted',updated_at=now() WHERE id=${body.id} AND business_id=${auth.businessId} AND deleted_at IS NULL AND order_type='delivery' RETURNING id,total_cop AS "totalCop"`;
    if (!order)
      return NextResponse.json(
        { error: "Domicilio no encontrado." },
        { status: 404 },
      );
    return NextResponse.json({ order });
  }
  if (body.action === "confirmDelivery") {
    if (!auth.role || !["owner", "admin", "cashier"].includes(auth.role))
      return NextResponse.json(
        { error: "No tienes permiso para confirmar domicilios." },
        { status: 403 },
      );
    const [order] =
      await auth.sql`UPDATE orders SET delivery_quote_status='confirmed',status='accepted',updated_at=now() WHERE id=${body.id} AND business_id=${auth.businessId} AND deleted_at IS NULL AND order_type='delivery' AND delivery_fee_cop IS NOT NULL RETURNING id`;
    if (!order)
      return NextResponse.json(
        { error: "Primero debes cotizar el domicilio." },
        { status: 409 },
      );
    return NextResponse.json({ order });
  }
  if (body.action === "deleteOrder") {
    if (
      !auth.role ||
      !["owner", "admin", "cashier", "kitchen"].includes(auth.role) ||
      !auth.userId
    )
      return NextResponse.json(
        { error: "No tienes permiso para eliminar pedidos." },
        { status: 403 },
      );
    const reason = body.reason?.trim().slice(0, 300) ?? "";
    if (reason.length < 5)
      return NextResponse.json(
        { error: "Escribe el motivo de la eliminación (mínimo 5 caracteres)." },
        { status: 400 },
      );
    const actorId = auth.userId;
    const actorRole = auth.role;
    const orderId = body.id;
    const deleted = await auth.sql.begin(async (transaction) => {
      const [order] =
        await transaction`SELECT * FROM orders WHERE id=${orderId} AND business_id=${auth.businessId} AND deleted_at IS NULL FOR UPDATE`;
      if (!order) return null;
      const items =
        await transaction`SELECT product_name AS "productName",unit_price_cop AS "unitPriceCop",quantity,subtotal_cop AS "subtotalCop" FROM order_items WHERE order_id=${order.id}`;
      await transaction`INSERT INTO order_deletion_log(order_id,business_id,order_reference,reason,deleted_by_user_id,deleted_by_name,deleted_by_role,order_snapshot) VALUES(${order.id},${auth.businessId},${order.reference},${reason},${actorId},${auth.userName},${actorRole},${transaction.json({ ...order, items })})`;
      await transaction`UPDATE orders SET deleted_at=now(),deleted_by_user_id=${actorId},deletion_reason=${reason},updated_at=now() WHERE id=${order.id}`;
      return order;
    });
    if (!deleted)
      return NextResponse.json(
        { error: "Pedido no encontrado o ya eliminado." },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  }
  if (body.action === "purgeDeleted") {
    if (auth.role !== "owner")
      return NextResponse.json(
        { error: "Solo el dueño puede retirar este registro de su negocio." },
        { status: 403 },
      );
    const [log] =
      await auth.sql`UPDATE order_deletion_log SET tenant_purged_at=now() WHERE id=${body.id} AND business_id=${auth.businessId} AND tenant_purged_at IS NULL RETURNING id`;
    if (!log)
      return NextResponse.json(
        { error: "Registro no encontrado." },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
