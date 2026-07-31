import { notFound } from "next/navigation";
import { ensureSchema } from "@/db/client";
import { PublicStore } from "@/components/public-store";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sql = await ensureSchema();
  const [business] = await sql`SELECT b.id,b.name,b.slug,b.description,b.logo_url AS "logoUrl",b.logo_size AS "logoSize",b.accepting_orders AS "acceptingOrders",b.primary_color AS "primaryColor",b.accent_color AS "accentColor",b.address,b.public_phone AS "publicPhone",b.whatsapp,b.menu_template AS "menuTemplate" FROM businesses b JOIN subscriptions s ON s.business_id=b.id WHERE b.slug=${slug} AND b.status IN ('trial','active') AND (s.is_lifetime OR (s.status='trialing' AND s.trial_ends_at>now()) OR (s.status='active' AND (s.current_period_ends_at IS NULL OR s.current_period_ends_at>now())))`;
  if (!business) notFound();
  const categories = await sql`SELECT id, name FROM categories WHERE business_id=${business.id} AND active=true ORDER BY sort_order, name`;
  const products = await sql`
    SELECT id, category_id AS "categoryId", name, description, price_cop AS "priceCop", packaging_fee_cop AS "packagingFeeCop", icon, image_url AS "imageUrl"
    FROM products WHERE business_id=${business.id} AND active=true ORDER BY created_at DESC`;
  const banners = await sql`SELECT id,eyebrow,title,description,image_url AS "imageUrl" FROM store_banners WHERE business_id=${business.id} AND active=true ORDER BY sort_order,created_at`;
  const hours = await sql`SELECT weekday,enabled,to_char(open_time,'HH24:MI') AS "openTime",to_char(close_time,'HH24:MI') AS "closeTime" FROM business_hours WHERE business_id=${business.id} ORDER BY weekday`;
  return <PublicStore business={{name:String(business.name),slug:String(business.slug),description:String(business.description),logoUrl:String(business.logoUrl),logoSize:Number(business.logoSize),acceptingOrders:Boolean(business.acceptingOrders),primaryColor:String(business.primaryColor),accentColor:String(business.accentColor),address:String(business.address),publicPhone:String(business.publicPhone),whatsapp:String(business.whatsapp),menuTemplate:String(business.menuTemplate)}} hours={hours.map(row=>({weekday:Number(row.weekday),enabled:Boolean(row.enabled),openTime:String(row.openTime),closeTime:String(row.closeTime)}))} banners={banners.map(row=>({id:String(row.id),eyebrow:String(row.eyebrow),title:String(row.title),description:String(row.description),imageUrl:String(row.imageUrl)}))} categories={categories.map((row) => ({ id: String(row.id), name: String(row.name) }))} products={products.map((row) => ({ id: String(row.id), categoryId: row.categoryId ? String(row.categoryId) : null, name: String(row.name), description: String(row.description), priceCop: Number(row.priceCop), packagingFeeCop: Number(row.packagingFeeCop), icon: String(row.icon), imageUrl: String(row.imageUrl) }))} />;
}
