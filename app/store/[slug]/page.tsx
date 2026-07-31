import { notFound } from "next/navigation";
import { ensureSchema } from "@/db/client";
import { PublicStore } from "@/components/public-store";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sql = await ensureSchema();
  const [business] = await sql`SELECT id,name,slug,description,logo_url AS "logoUrl",primary_color AS "primaryColor",accent_color AS "accentColor",address,public_phone AS "publicPhone",whatsapp FROM businesses WHERE slug=${slug} AND status IN ('trial','active')`;
  if (!business) notFound();
  const categories = await sql`SELECT id, name FROM categories WHERE business_id=${business.id} AND active=true ORDER BY sort_order, name`;
  const products = await sql`
    SELECT id, category_id AS "categoryId", name, description, price_cop AS "priceCop", packaging_fee_cop AS "packagingFeeCop", icon, image_url AS "imageUrl"
    FROM products WHERE business_id=${business.id} AND active=true ORDER BY created_at DESC`;
  return <PublicStore business={{name:String(business.name),slug:String(business.slug),description:String(business.description),logoUrl:String(business.logoUrl),primaryColor:String(business.primaryColor),accentColor:String(business.accentColor),address:String(business.address),publicPhone:String(business.publicPhone),whatsapp:String(business.whatsapp)}} categories={categories.map((row) => ({ id: String(row.id), name: String(row.name) }))} products={products.map((row) => ({ id: String(row.id), categoryId: row.categoryId ? String(row.categoryId) : null, name: String(row.name), description: String(row.description), priceCop: Number(row.priceCop), packagingFeeCop: Number(row.packagingFeeCop), icon: String(row.icon), imageUrl: String(row.imageUrl) }))} />;
}
