import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session?.businessId || !session.userId || !session.role || !["owner", "admin", "waiter"].includes(session.role)) return NextResponse.json({ error: "No tienes permiso para tomar pedidos." }, { status: 403 });
  const businessId = session.businessId;
  const userId = session.userId;
  const body = await request.json().catch(() => null) as { tableId?: string; notes?: string; items?: Array<{ productId?: string; quantity?: number }> } | null;
  if (!body?.tableId || !body.items?.length) return NextResponse.json({ error: "Selecciona una mesa y agrega productos." }, { status: 400 });
  const quantities = new Map<string, number>();
  for (const item of body.items) {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return NextResponse.json({ error: "El pedido contiene productos inválidos." }, { status: 400 });
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + quantity);
  }
  const sql = await ensureSchema();
  const[subscription]=await sql`SELECT 1 FROM subscriptions WHERE business_id=${businessId} AND (is_lifetime OR (status='trialing' AND trial_ends_at>now()) OR (status='active' AND (current_period_ends_at IS NULL OR current_period_ends_at>now())))`;
  if(!subscription)return NextResponse.json({error:"La suscripción del negocio no está activa."},{status:402});
  const [table] = await sql`SELECT id,name FROM restaurant_tables WHERE id=${body.tableId} AND business_id=${businessId} AND active=true`;
  if (!table) return NextResponse.json({ error: "Mesa no disponible." }, { status: 404 });
  const ids = [...quantities.keys()];
  const products = await sql`SELECT id,name,price_cop,stock_quantity FROM products WHERE business_id=${businessId} AND active=true AND id IN ${sql(ids)}`;
  if (products.length !== ids.length) return NextResponse.json({ error: "Uno de los productos no está disponible." }, { status: 409 });
  for (const product of products) {
    const qty = quantities.get(String(product.id)) ?? 0;
    const stock = product.stock_quantity !== null ? Number(product.stock_quantity) : null;
    if (stock !== null && stock < qty) {
      return NextResponse.json({
        error: stock === 0
          ? `El producto "${product.name}" está agotado.`
          : `El producto "${product.name}" solo tiene ${stock} unidad(es) disponible(s).`
      }, { status: 409 });
    }
  }
  const totalCop = products.reduce((total, product) => total + Number(product.price_cop) * (quantities.get(String(product.id)) ?? 0), 0);
  const reference = `TP-${randomBytes(4).toString("hex").toUpperCase()}`;
  const result=await sql.begin(async (transaction) => {
    let [order] = await transaction`SELECT id,reference FROM orders WHERE business_id=${businessId} AND table_id=${table.id} AND order_type='dine_in' AND status NOT IN ('delivered','cancelled') AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE`;
    const existing=Boolean(order);
    if(!order)[order]=await transaction`INSERT INTO orders (business_id,reference,order_type,customer_name,customer_phone,notes,total_cop,table_id,created_by_user_id) VALUES (${businessId},${reference},'dine_in',${String(table.name)},'',${body.notes?.trim().slice(0,500) ?? ""},${totalCop},${table.id},${userId}) RETURNING id,reference`;
    else await transaction`UPDATE orders SET total_cop=total_cop+${totalCop},status=CASE WHEN status='ready' THEN 'preparing' ELSE status END,notes=CASE WHEN ${body.notes?.trim().slice(0,500)??""}='' THEN notes ELSE concat_ws(E'\n',NULLIF(notes,''),${body.notes?.trim().slice(0,500)??""}) END,updated_at=now() WHERE id=${order.id}`;
    for (const product of products) {
      const quantity = quantities.get(String(product.id)) ?? 0;
      await transaction`INSERT INTO order_items (order_id,product_id,product_name,unit_price_cop,quantity,subtotal_cop) VALUES (${order.id},${product.id},${product.name},${product.price_cop},${quantity},${Number(product.price_cop)*quantity})`;
      if (product.stock_quantity !== null) {
        await transaction`UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ${quantity}), updated_at=now() WHERE id=${product.id} AND stock_quantity IS NOT NULL`;
      }
    }
    return {reference:String(order.reference),existing};
  });
  return NextResponse.json({ ok: true, reference:result.reference, totalCop, addedToExisting:result.existing }, { status: 201 });
}
