import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

export const runtime = "nodejs";

async function context() {
  const session = await currentSession();
  if (!session?.businessId) return null;
  return { businessId: session.businessId, role: session.role, sql: await ensureSchema() };
}

export async function GET() {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  const { sql, businessId } = auth;
  const categories = await sql`
    SELECT id, name, active, sort_order AS "sortOrder"
    FROM categories WHERE business_id = ${businessId}
    ORDER BY sort_order, name`;
  const products = await sql`
    SELECT p.id, p.name, p.description, p.price_cop AS "priceCop", p.image_url AS "imageUrl",
           p.active, p.category_id AS "categoryId", c.name AS "categoryName"
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id AND c.business_id = ${businessId}
    WHERE p.business_id = ${businessId}
    ORDER BY p.created_at DESC`;
  return NextResponse.json({ categories, products });
}

export async function POST(request: Request) {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  if (!auth.role || !["owner", "admin"].includes(auth.role)) return NextResponse.json({ error: "No tienes permiso para modificar productos." }, { status: 403 });
  const { sql, businessId } = auth;

  try {
    if (body.action === "createCategory") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2 || name.length > 50) return NextResponse.json({ error: "Escribe un nombre de categoría válido." }, { status: 400 });
      const [category] = await sql`
        INSERT INTO categories (business_id, name)
        VALUES (${businessId}, ${name})
        RETURNING id, name, active, sort_order AS "sortOrder"`;
      return NextResponse.json({ category }, { status: 201 });
    }

    if (body.action === "saveProduct") {
      const id = typeof body.id === "string" ? body.id : null;
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
      const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;
      const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim().slice(0, 1000) : "";
      const priceCop = Number(body.priceCop);
      if (name.length < 2 || name.length > 100 || !Number.isInteger(priceCop) || priceCop < 0) {
        return NextResponse.json({ error: "Revisa el nombre y el precio del producto." }, { status: 400 });
      }
      if (imageUrl && !(/^https?:\/\//i.test(imageUrl) || /^\/api\/media\/[0-9a-f-]{36}$/i.test(imageUrl))) return NextResponse.json({ error: "La imagen seleccionada no es válida." }, { status: 400 });
      if (categoryId) {
        const [category] = await sql`SELECT id FROM categories WHERE id = ${categoryId} AND business_id = ${businessId}`;
        if (!category) return NextResponse.json({ error: "La categoría no pertenece a este negocio." }, { status: 400 });
      }

      const [product] = id
        ? await sql`
            UPDATE products SET name=${name}, description=${description}, price_cop=${priceCop},
              image_url=${imageUrl}, category_id=${categoryId}, updated_at=now()
            WHERE id=${id} AND business_id=${businessId}
            RETURNING id`
        : await sql`
            INSERT INTO products (business_id, category_id, name, description, price_cop, image_url)
            VALUES (${businessId}, ${categoryId}, ${name}, ${description}, ${priceCop}, ${imageUrl})
            RETURNING id`;
      if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
      return NextResponse.json({ ok: true, id: product.id }, { status: id ? 200 : 201 });
    }

    if (body.action === "toggleProduct") {
      const id = typeof body.id === "string" ? body.id : "";
      const [product] = await sql`
        UPDATE products SET active = NOT active, updated_at=now()
        WHERE id=${id} AND business_id=${businessId}
        RETURNING id, active`;
      if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
      return NextResponse.json({ product });
    }

    if (body.action === "deleteProduct") {
      const id = typeof body.id === "string" ? body.id : "";
      const [product] = await sql`DELETE FROM products WHERE id=${id} AND business_id=${businessId} RETURNING id`;
      if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }
    console.error("Catalog action failed", error);
    return NextResponse.json({ error: "No fue posible guardar los cambios." }, { status: 500 });
  }
}
