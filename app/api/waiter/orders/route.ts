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
  const [table] = await sql`SELECT id,name FROM restaurant_tables WHERE id=${body.tableId} AND business_id=${businessId} AND active=true`;
  if (!table) return NextResponse.json({ error: "Mesa no disponible." }, { status: 404 });
  const ids = [...quantities.keys()];
  const products = await sql`SELECT id,name,price_cop FROM products WHERE business_id=${businessId} AND active=true AND id IN ${sql(ids)}`;
  if (products.length !== ids.length) return NextResponse.json({ error: "Uno de los productos no está disponible." }, { status: 409 });
  const totalCop = products.reduce((total, product) => total + Number(product.price_cop) * (quantities.get(String(product.id)) ?? 0), 0);
  const reference = `TP-${randomBytes(4).toString("hex").toUpperCase()}`;
  await sql.begin(async (transaction) => {
    const [order] = await transaction`
      INSERT INTO orders (business_id,reference,order_type,customer_name,customer_phone,notes,total_cop,table_id,created_by_user_id)
      VALUES (${businessId},${reference},'dine_in',${String(table.name)},'',${body.notes?.trim().slice(0,500) ?? ""},${totalCop},${table.id},${userId}) RETURNING id`;
    for (const product of products) {
      const quantity = quantities.get(String(product.id)) ?? 0;
      await transaction`INSERT INTO order_items (order_id,product_id,product_name,unit_price_cop,quantity,subtotal_cop) VALUES (${order.id},${product.id},${product.name},${product.price_cop},${quantity},${Number(product.price_cop)*quantity})`;
    }
  });
  return NextResponse.json({ ok: true, reference, totalCop }, { status: 201 });
}
