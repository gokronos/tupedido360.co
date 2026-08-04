import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";
import { parseOrderItems } from "@/lib/order-input";

class InsufficientStockError extends Error {
  constructor(public productName: string) {
    super("INSUFFICIENT_STOCK");
  }
}

class OrderUnavailableError extends Error {}

export async function POST(request: Request) {
  const session = await currentSession();
  if (
    !session?.businessId ||
    !session.userId ||
    !session.role ||
    !["owner", "admin", "cashier", "waiter"].includes(session.role)
  )
    return NextResponse.json(
      { error: "No tienes permiso para tomar pedidos." },
      { status: 403 },
    );
  const businessId = session.businessId;
  const userId = session.userId;
  const body = (await request.json().catch(() => null)) as {
    tableId?: string;
    orderId?: string;
    notes?: string;
    items?: Array<{ productId?: string; quantity?: number }>;
    participantId?: string;
    participants?: Array<{
      label?: string;
      items?: Array<{ productId?: string; quantity?: number }>;
    }>;
  } | null;
  if (!body?.tableId)
    return NextResponse.json(
      { error: "Selecciona una mesa y agrega productos." },
      { status: 400 },
    );
  const participantInputs = body.participants;
  if (participantInputs && (participantInputs.length < 2 || participantInputs.length > 20))
    return NextResponse.json(
      { error: "El pedido por personas debe tener entre 2 y 20 cuentas." },
      { status: 400 },
    );
  const parsedParticipants = participantInputs?.map((participant) => ({
    label: participant.label?.trim().slice(0, 40) ?? "",
    parsed: parseOrderItems(participant.items),
  }));
  if (parsedParticipants?.some((participant) => !participant.parsed.ok))
    return NextResponse.json(
      { error: "Cada persona debe tener al menos un producto válido." },
      { status: 400 },
    );
  const normalizedItems = participantInputs
    ? participantInputs.flatMap((participant) => participant.items ?? [])
    : body.items;
  const parsedItems = parseOrderItems(normalizedItems);
  if (!parsedItems.ok)
    return NextResponse.json(
      {
        error:
          parsedItems.reason === "quantity_limit"
            ? "La cantidad máxima por producto es 50."
            : "El pedido contiene productos inválidos.",
      },
      { status: 400 },
    );
  const quantities = parsedItems.quantities;
  const sql = await ensureSchema();
  const [subscription] =
    await sql`SELECT 1 FROM subscriptions WHERE business_id=${businessId} AND (is_lifetime OR (status='trialing' AND trial_ends_at>now()) OR (status='active' AND (current_period_ends_at IS NULL OR current_period_ends_at>now())))`;
  if (!subscription)
    return NextResponse.json(
      { error: "La suscripción del negocio no está activa." },
      { status: 402 },
    );
  const [table] =
    await sql`SELECT id,name FROM restaurant_tables WHERE id=${body.tableId} AND business_id=${businessId} AND active=true`;
  if (!table)
    return NextResponse.json({ error: "Mesa no disponible." }, { status: 404 });
  const ids = [...quantities.keys()];
  const products =
    await sql`SELECT id,name,price_cop,stock_quantity FROM products WHERE business_id=${businessId} AND active=true AND id IN ${sql(ids)}`;
  if (products.length !== ids.length)
    return NextResponse.json(
      { error: "Uno de los productos no está disponible." },
      { status: 409 },
    );
  for (const product of products) {
    const qty = quantities.get(String(product.id)) ?? 0;
    const stock =
      product.stock_quantity !== null ? Number(product.stock_quantity) : null;
    if (stock !== null && stock < qty) {
      return NextResponse.json(
        {
          error:
            stock === 0
              ? `El producto "${product.name}" está agotado.`
              : `El producto "${product.name}" solo tiene ${stock} unidad(es) disponible(s).`,
        },
        { status: 409 },
      );
    }
  }
  let totalCop = 0;
  const reference = `TP-${randomBytes(4).toString("hex").toUpperCase()}`;
  let result: { reference: string; existing: boolean };
  try {
    result = await sql.begin(async (transaction) => {
      const lockedProducts = [];
      for (const product of products) {
        const quantity = quantities.get(String(product.id)) ?? 0;
        const updated = await transaction`
        UPDATE products
        SET stock_quantity=CASE WHEN stock_quantity IS NULL THEN NULL ELSE stock_quantity-${quantity} END,
            updated_at=now()
        WHERE id=${product.id} AND business_id=${businessId} AND active=true
          AND (stock_quantity IS NULL OR stock_quantity>=${quantity})
        RETURNING id,name,price_cop`;
        if (!updated.length)
          throw new InsufficientStockError(String(product.name));
        lockedProducts.push(updated[0]);
      }
      totalCop = lockedProducts.reduce(
        (total, product) =>
          total +
          Number(product.price_cop) * (quantities.get(String(product.id)) ?? 0),
        0,
      );
      let [order] = body.orderId
        ? await transaction`SELECT id,reference,split_mode FROM orders WHERE id=${body.orderId} AND business_id=${businessId} AND table_id=${table.id} AND order_type='dine_in' AND status NOT IN ('delivered','cancelled') AND deleted_at IS NULL FOR UPDATE`
        : await transaction`SELECT id,reference,split_mode FROM orders WHERE business_id=${businessId} AND table_id=${table.id} AND order_type='dine_in' AND status NOT IN ('delivered','cancelled') AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE`;
      if (body.orderId && !order) throw new OrderUnavailableError();
      if (participantInputs && order) throw new OrderUnavailableError();
      const existing = Boolean(order);
      if (!order)
        [order] =
          await transaction`INSERT INTO orders (business_id,reference,order_type,customer_name,customer_phone,notes,total_cop,table_id,created_by_user_id,split_mode) VALUES (${businessId},${reference},'dine_in',${String(table.name)},'',${body.notes?.trim().slice(0, 500) ?? ""},${totalCop},${table.id},${userId},${Boolean(participantInputs)}) RETURNING id,reference`;
      else
        await transaction`UPDATE orders SET total_cop=total_cop+${totalCop},status=CASE WHEN status='ready' THEN 'preparing' ELSE status END,notes=CASE WHEN ${body.notes?.trim().slice(0, 500) ?? ""}::text='' THEN notes ELSE concat_ws(E'\n',NULLIF(notes,''),${body.notes?.trim().slice(0, 500) ?? ""}::text) END,updated_at=now() WHERE id=${order.id}`;
      const additionRound = existing
        ? Number(
            (
              await transaction`SELECT COALESCE(MAX(addition_round),0)+1 AS round FROM order_items WHERE order_id=${order.id}`
            )[0].round,
          )
        : 0;
      const additionParticipantId = body.participantId ?? null;
      if (existing && Boolean(order.split_mode) && !additionParticipantId)
        throw new OrderUnavailableError();
      if (additionParticipantId) {
        const [participant] = await transaction`SELECT id FROM order_participants WHERE id=${additionParticipantId} AND order_id=${order.id} AND business_id=${businessId}`;
        if (!participant) throw new OrderUnavailableError();
      }
      if (parsedParticipants) {
        for (let index = 0; index < parsedParticipants.length; index += 1) {
          const participantInput = parsedParticipants[index];
          const [participant] = await transaction`INSERT INTO order_participants (business_id,order_id,position,label) VALUES (${businessId},${order.id},${index + 1},${participantInput.label || `Persona ${index + 1}`}) RETURNING id`;
          const participantQuantities = participantInput.parsed.ok
            ? participantInput.parsed.quantities
            : new Map<string, number>();
          for (const product of lockedProducts) {
            const quantity = participantQuantities.get(String(product.id)) ?? 0;
            if (quantity > 0)
              await transaction`INSERT INTO order_items (order_id,product_id,product_name,unit_price_cop,quantity,subtotal_cop,addition_round,added_at,participant_id) VALUES (${order.id},${product.id},${product.name},${product.price_cop},${quantity},${Number(product.price_cop) * quantity},0,now(),${participant.id})`;
          }
        }
      } else for (const product of lockedProducts) {
        const quantity = quantities.get(String(product.id)) ?? 0;
        await transaction`INSERT INTO order_items (order_id,product_id,product_name,unit_price_cop,quantity,subtotal_cop,addition_round,added_at,participant_id) VALUES (${order.id},${product.id},${product.name},${product.price_cop},${quantity},${Number(product.price_cop) * quantity},${additionRound},now(),${additionParticipantId})`;
      }
      return { reference: String(order.reference), existing };
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: `El producto "${error.productName}" cambió de disponibilidad. Actualiza el pedido.`,
        },
        { status: 409 },
      );
    }
    if (error instanceof OrderUnavailableError) {
      return NextResponse.json(
        { error: "Este pedido ya fue cerrado o no está disponible." },
        { status: 409 },
      );
    }
    console.error("Failed to save waiter order", error);
    return NextResponse.json(
      { error: "No se pudo guardar la adición. Intente nuevamente." },
      { status: 500 },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      reference: result.reference,
      totalCop,
      addedToExisting: result.existing,
    },
    { status: 201 },
  );
}
