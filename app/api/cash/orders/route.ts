import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";
import { parseOrderItems } from "@/lib/order-input";
import { broadcastNewOrderNotification } from "@/lib/push-notifications";

class InsufficientStockError extends Error {
  constructor(public productName: string) {
    super("INSUFFICIENT_STOCK");
  }
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (
    !session?.businessId ||
    !session.userId ||
    !session.role ||
    !["owner", "admin", "cashier"].includes(session.role)
  )
    return NextResponse.json(
      { error: "No tiene permiso para registrar ventas en caja." },
      { status: 403 },
    );

  const body = (await request.json().catch(() => null)) as {
    paymentMethod?: string;
    fulfillment?: string;
    notes?: string;
    items?: Array<{ productId?: string; quantity?: number }>;
  } | null;
  const paymentMethod =
    body?.paymentMethod === "transfer" ? "transfer" : "cash";
  const fulfillment =
    body?.fulfillment === "preparation" ? "preparation" : "delivered";
  const parsedItems = parseOrderItems(body?.items);
  if (!parsedItems.ok)
    return NextResponse.json(
      {
        error:
          parsedItems.reason === "quantity_limit"
            ? "La cantidad máxima por producto es 50."
            : "Agregue productos válidos a la venta.",
      },
      { status: 400 },
    );

  const businessId = session.businessId;
  const userId = session.userId;
  const quantities = parsedItems.quantities;
  const sql = await ensureSchema();
  const [subscription] =
    await sql`SELECT 1 FROM subscriptions WHERE business_id=${businessId} AND (is_lifetime OR (status='trialing' AND trial_ends_at>now()) OR (status='active' AND (current_period_ends_at IS NULL OR current_period_ends_at>now())))`;
  if (!subscription)
    return NextResponse.json(
      { error: "La suscripción del negocio no está activa." },
      { status: 402 },
    );

  const ids = [...quantities.keys()];
  const products =
    await sql`SELECT id,name,price_cop,packaging_fee_cop,stock_quantity FROM products WHERE business_id=${businessId} AND active=true AND id IN ${sql(ids)}`;
  if (products.length !== ids.length)
    return NextResponse.json(
      { error: "Uno de los productos ya no está disponible." },
      { status: 409 },
    );

  const reference = `CJ-${randomBytes(4).toString("hex").toUpperCase()}`;
  let totalCop = 0;
  let packagingTotalCop = 0;
  try {
    await sql.begin(async (transaction) => {
      const lockedProducts = [];
      for (const product of products) {
        const quantity = quantities.get(String(product.id)) ?? 0;
        const [updated] = await transaction`
          UPDATE products SET
            stock_quantity=CASE WHEN stock_quantity IS NULL THEN NULL ELSE stock_quantity-${quantity} END,
            updated_at=now()
          WHERE id=${product.id} AND business_id=${businessId} AND active=true
            AND (stock_quantity IS NULL OR stock_quantity>=${quantity})
          RETURNING id,name,price_cop,packaging_fee_cop`;
        if (!updated)
          throw new InsufficientStockError(String(product.name));
        lockedProducts.push(updated);
      }
      const productsTotalCop = lockedProducts.reduce(
        (total, product) =>
          total +
          Number(product.price_cop) *
            (quantities.get(String(product.id)) ?? 0),
        0,
      );
      packagingTotalCop = lockedProducts.reduce(
        (total, product) =>
          total +
          Number(product.packaging_fee_cop) *
            (quantities.get(String(product.id)) ?? 0),
        0,
      );
      totalCop = productsTotalCop + packagingTotalCop;
      const [order] = await transaction`
        INSERT INTO orders(business_id,reference,order_type,customer_name,customer_phone,
          payment_method,payment_status,delivery_quote_status,notes,total_cop,packaging_total_cop,
          status,paid,created_by_user_id)
        VALUES(${businessId},${reference},'pickup','Venta en caja','',${paymentMethod},'verified',
          'not_applicable',${body?.notes?.trim().slice(0, 500) ?? ""},${totalCop},${packagingTotalCop},
          ${fulfillment === "preparation" ? "received" : "delivered"},true,${userId})
        RETURNING id`;
      for (const product of lockedProducts) {
        const quantity = quantities.get(String(product.id)) ?? 0;
        await transaction`
          INSERT INTO order_items(order_id,product_id,product_name,unit_price_cop,quantity,subtotal_cop)
          VALUES(${order.id},${product.id},${product.name},${product.price_cop},${quantity},${Number(product.price_cop) * quantity})`;
      }
    });
  } catch (error) {
    if (error instanceof InsufficientStockError)
      return NextResponse.json(
        { error: `El producto "${error.productName}" está agotado o cambió de disponibilidad.` },
        { status: 409 },
      );
    console.error("Cash sale failed", error);
    return NextResponse.json(
      { error: "No se pudo registrar la venta." },
      { status: 500 },
    );
  }

  if (fulfillment === "preparation")
    broadcastNewOrderNotification(businessId, {
      id: reference,
      orderNumber: reference,
      customerName: "Venta en caja",
      totalCop,
      orderType: "pickup",
    }).catch(() => null);

  return NextResponse.json(
    { ok: true, reference, totalCop, packagingTotalCop, fulfillment },
    { status: 201 },
  );
}
