import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

const templates = new Set(["classic", "catalog", "impact"]);

async function context() {
  const session = await currentSession();
  if (!session?.businessId || !["owner", "admin"].includes(session.role ?? "")) return null;
  return { businessId: session.businessId, sql: await ensureSchema() };
}

export async function GET() {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "No tienes permiso para editar el diseño." }, { status: 403 });
  const [[business], banners] = await Promise.all([
    auth.sql`SELECT menu_template AS "menuTemplate" FROM businesses WHERE id=${auth.businessId}`,
    auth.sql`SELECT id,eyebrow,title,description,image_url AS "imageUrl",active,sort_order AS "sortOrder" FROM store_banners WHERE business_id=${auth.businessId} ORDER BY sort_order,created_at`,
  ]);
  return NextResponse.json({ menuTemplate: String(business?.menuTemplate ?? "classic"), banners });
}

export async function POST(request: Request) {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "No tienes permiso para editar el diseño." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  if (body.action === "setTemplate") {
    const template = String(body.template ?? "");
    if (!templates.has(template)) return NextResponse.json({ error: "Diseño no válido." }, { status: 400 });
    await auth.sql`UPDATE businesses SET menu_template=${template},updated_at=now() WHERE id=${auth.businessId}`;
    return NextResponse.json({ ok: true });
  }
  if (body.action === "saveBanner") {
    const id = typeof body.id === "string" ? body.id : "";
    const title = String(body.title ?? "").trim().slice(0,120);
    const eyebrow = String(body.eyebrow ?? "").trim().slice(0,50);
    const description = String(body.description ?? "").trim().slice(0,280);
    const imageUrl = String(body.imageUrl ?? "").trim().slice(0,1000);
    const active = body.active !== false;
    const sortOrder = Math.max(0, Number(body.sortOrder) || 0);
    const validImage = !imageUrl || /^https?:\/\//i.test(imageUrl) || /^\/api\/media\/[0-9a-f-]{36}$/i.test(imageUrl);
    if (title.length < 3 || !validImage) return NextResponse.json({ error: "Agrega un título y una imagen válida." }, { status: 400 });
    if (id) await auth.sql`UPDATE store_banners SET eyebrow=${eyebrow},title=${title},description=${description},image_url=${imageUrl},active=${active},sort_order=${sortOrder},updated_at=now() WHERE id=${id} AND business_id=${auth.businessId}`;
    else await auth.sql`INSERT INTO store_banners(business_id,eyebrow,title,description,image_url,active,sort_order) VALUES(${auth.businessId},${eyebrow},${title},${description},${imageUrl},${active},${sortOrder})`;
    return NextResponse.json({ ok: true });
  }
  if (body.action === "deleteBanner") {
    await auth.sql`DELETE FROM store_banners WHERE id=${String(body.id ?? "")} AND business_id=${auth.businessId}`;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
