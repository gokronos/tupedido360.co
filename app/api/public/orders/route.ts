import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { customerCookie, customerToken, currentCustomer } from "@/lib/customer-session";
import {rateLimit,requestIp} from "@/lib/rate-limit";

type OrderBody = { slug?: string; orderType?: string; customerName?: string; customerPhone?: string; deliveryAddress?: string; neighborhood?: string; addressReference?: string; paymentMethod?: string; notes?: string; items?: Array<{ productId?: string; quantity?: number }> };

export async function POST(request: Request) {
  if(!rateLimit(`public-order:${requestIp(request)}`,20,10*60_000))return NextResponse.json({error:"Se enviaron demasiados pedidos desde este dispositivo. Espera unos minutos."},{status:429});
  const body = await request.json().catch(() => null) as OrderBody | null;
  const slug = body?.slug?.trim().toLowerCase();
  const orderType = body?.orderType;
  const validOrderType = orderType === "delivery" || orderType === "pickup" ? orderType : null;
  const customerName = body?.customerName?.trim();
  const rawPhone = body?.customerPhone?.trim() ?? "";
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const customerPhone = phoneDigits.length === 10 && phoneDigits.startsWith("3") ? `57${phoneDigits}` : phoneDigits;
  const deliveryAddress = body?.deliveryAddress?.trim() ?? "";
  const neighborhood = body?.neighborhood?.trim().slice(0, 100) ?? "";
  const addressReference = body?.addressReference?.trim().slice(0, 180) ?? "";
  const paymentMethod = ["cash", "transfer", "pay_at_store"].includes(body?.paymentMethod ?? "") ? body!.paymentMethod! : "cash";
  const notes = body?.notes?.trim().slice(0, 500) ?? "";
  if (!slug || !validOrderType || !customerName || customerName.length < 3 || customerPhone.length < 10 || customerPhone.length > 15 || !body?.items?.length || body.items.length > 50) {
    return NextResponse.json({ error: "Revisa los datos del pedido." }, { status: 400 });
  }
  if (validOrderType === "delivery" && (deliveryAddress.length < 5 || neighborhood.length < 2)) return NextResponse.json({ error: "Escribe la dirección y el barrio de entrega." }, { status: 400 });
  const quantities = new Map<string, number>();
  for (const item of body.items) {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return NextResponse.json({ error: "Hay productos inválidos en el carrito." }, { status: 400 });
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + quantity);
  }

  const sql = await ensureSchema();
  const [business] = await sql`SELECT b.id,b.accepting_orders,EXISTS(SELECT 1 FROM business_hours h WHERE h.business_id=b.id AND h.weekday=EXTRACT(ISODOW FROM timezone(b.timezone,now()))::int-1 AND h.enabled AND timezone(b.timezone,now())::time>=h.open_time AND timezone(b.timezone,now())::time<h.close_time) AS "openNow" FROM businesses b JOIN subscriptions s ON s.business_id=b.id WHERE b.slug=${slug} AND b.status IN ('trial','active') AND (s.is_lifetime OR (s.status='trialing' AND s.trial_ends_at>now()) OR (s.status='active' AND (s.current_period_ends_at IS NULL OR s.current_period_ends_at>now())))`;
  if (!business) return NextResponse.json({ error: "Negocio no disponible." }, { status: 404 });
  if(!business.accepting_orders||!business.openNow)return NextResponse.json({error:"El negocio está cerrado y no recibe pedidos en este momento."},{status:409});
  const ids = [...quantities.keys()];
  const products = await sql`
    SELECT id, name, price_cop, packaging_fee_cop FROM products
    WHERE business_id=${business.id} AND active=true AND id IN ${sql(ids)}`;
  if (products.length !== ids.length) return NextResponse.json({ error: "Uno de los productos ya no está disponible." }, { status: 409 });
  const productsTotalCop = products.reduce((total, product) => total + Number(product.price_cop) * (quantities.get(String(product.id)) ?? 0), 0);
  const packagingTotalCop = products.reduce((total, product) => total + Number(product.packaging_fee_cop) * (quantities.get(String(product.id)) ?? 0), 0);
  const totalCop = productsTotalCop + packagingTotalCop;
  const reference = `TP-${randomBytes(4).toString("hex").toUpperCase()}`;
  const order = await sql.begin(async (transaction) => {
    const [customer] = await transaction`
      INSERT INTO customers (business_id,name,whatsapp) VALUES (${business.id},${customerName},${customerPhone})
      ON CONFLICT (business_id,whatsapp) DO UPDATE SET name=EXCLUDED.name,updated_at=now() RETURNING id`;
    if (validOrderType === "delivery") await transaction`
      INSERT INTO customer_addresses (customer_id,address,neighborhood,reference) VALUES (${customer.id},${deliveryAddress},${neighborhood},${addressReference})
      ON CONFLICT (customer_id,address,neighborhood) DO UPDATE SET reference=EXCLUDED.reference,last_used_at=now()`;
    const [created] = await transaction`
      INSERT INTO orders (business_id, reference, order_type, customer_name, customer_phone, delivery_address, neighborhood, address_reference,
        payment_method, payment_status, delivery_quote_status, notes, total_cop, packaging_total_cop, customer_id)
      VALUES (${business.id}, ${reference}, ${validOrderType}, ${customerName}, ${customerPhone}, ${deliveryAddress}, ${neighborhood}, ${addressReference},
        ${paymentMethod}, ${paymentMethod === "transfer" ? "pending_verification" : "pending"}, ${validOrderType === "delivery" ? "pending_quote" : "not_applicable"}, ${notes}, ${totalCop}, ${packagingTotalCop}, ${customer.id})
      RETURNING id, reference`;
    for (const product of products) {
      const quantity = quantities.get(String(product.id)) ?? 0;
      await transaction`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price_cop, quantity, subtotal_cop)
        VALUES (${created.id}, ${product.id}, ${product.name}, ${product.price_cop}, ${quantity}, ${Number(product.price_cop) * quantity})`;
    }
    return { reference: String(created.reference), customerId: String(customer.id) };
  });
  const previous = await currentCustomer(slug);
  const issuedAt = previous?.businessId === String(business.id) && previous.customerId === order.customerId ? previous.issuedAt : Date.now() - 60_000;
  const response = NextResponse.json({ ok: true, reference: order.reference, totalCop, packagingTotalCop }, { status: 201 });
  const cookie=customerCookie(slug);response.cookies.set(cookie.name,customerToken({customerId:order.customerId,businessId:String(business.id),businessSlug:slug,issuedAt,expiresAt:Date.now()+cookie.options.maxAge*1000}),cookie.options);
  return response;
}
