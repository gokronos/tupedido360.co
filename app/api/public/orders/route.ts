import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";

type OrderBody = { slug?: string; orderType?: string; customerName?: string; customerPhone?: string; deliveryAddress?: string; notes?: string; items?: Array<{ productId?: string; quantity?: number }> };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as OrderBody | null;
  const slug = body?.slug?.trim().toLowerCase();
  const orderType = body?.orderType;
  const validOrderType = orderType === "delivery" || orderType === "pickup" ? orderType : null;
  const customerName = body?.customerName?.trim();
  const customerPhone = body?.customerPhone?.trim();
  const deliveryAddress = body?.deliveryAddress?.trim() ?? "";
  const notes = body?.notes?.trim().slice(0, 500) ?? "";
  if (!slug || !validOrderType || !customerName || customerName.length < 3 || !customerPhone || customerPhone.length < 7 || !body?.items?.length || body.items.length > 50) {
    return NextResponse.json({ error: "Revisa los datos del pedido." }, { status: 400 });
  }
  if (validOrderType === "delivery" && deliveryAddress.length < 5) return NextResponse.json({ error: "Escribe la dirección de entrega." }, { status: 400 });
  const quantities = new Map<string, number>();
  for (const item of body.items) {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return NextResponse.json({ error: "Hay productos inválidos en el carrito." }, { status: 400 });
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + quantity);
  }

  const sql = await ensureSchema();
  const [business] = await sql`SELECT id FROM businesses WHERE slug=${slug} AND status IN ('trial','active')`;
  if (!business) return NextResponse.json({ error: "Negocio no disponible." }, { status: 404 });
  const ids = [...quantities.keys()];
  const products = await sql`
    SELECT id, name, price_cop FROM products
    WHERE business_id=${business.id} AND active=true AND id IN ${sql(ids)}`;
  if (products.length !== ids.length) return NextResponse.json({ error: "Uno de los productos ya no está disponible." }, { status: 409 });
  const totalCop = products.reduce((total, product) => total + Number(product.price_cop) * (quantities.get(String(product.id)) ?? 0), 0);
  const reference = `TP-${randomBytes(4).toString("hex").toUpperCase()}`;
  const order = await sql.begin(async (transaction) => {
    const [created] = await transaction`
      INSERT INTO orders (business_id, reference, order_type, customer_name, customer_phone, delivery_address, notes, total_cop)
      VALUES (${business.id}, ${reference}, ${validOrderType}, ${customerName}, ${customerPhone}, ${deliveryAddress}, ${notes}, ${totalCop})
      RETURNING id, reference`;
    for (const product of products) {
      const quantity = quantities.get(String(product.id)) ?? 0;
      await transaction`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price_cop, quantity, subtotal_cop)
        VALUES (${created.id}, ${product.id}, ${product.name}, ${product.price_cop}, ${quantity}, ${Number(product.price_cop) * quantity})`;
    }
    return created;
  });
  return NextResponse.json({ ok: true, reference: order.reference, totalCop }, { status: 201 });
}
