import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

async function context() {
  const session = await currentSession();
  if (!session?.businessId) return null;
  return { businessId: session.businessId, role: session.role, sql: await ensureSchema() };
}

export async function GET() {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  const tables = await auth.sql`SELECT id,name,active FROM restaurant_tables WHERE business_id=${auth.businessId} ORDER BY name`;
  return NextResponse.json({ tables });
}

export async function POST(request: Request) {
  const auth = await context();
  if (!auth || !auth.role || !["owner", "admin"].includes(auth.role)) return NextResponse.json({ error: "No tienes permiso para administrar mesas." }, { status: 403 });
  const body = await request.json().catch(() => null) as { action?: string; id?: string; name?: string } | null;
  try {
    if (body?.action === "createTable") {
      const name = body.name?.trim();
      if (!name || name.length > 40) return NextResponse.json({ error: "Escribe un nombre de mesa válido." }, { status: 400 });
      const [table] = await auth.sql`INSERT INTO restaurant_tables (business_id,name) VALUES (${auth.businessId},${name}) RETURNING id,name,active`;
      return NextResponse.json({ table }, { status: 201 });
    }
    if (body?.action === "toggleTable" && body.id) {
      const [table] = await auth.sql`UPDATE restaurant_tables SET active=NOT active WHERE id=${body.id} AND business_id=${auth.businessId} RETURNING id,active`;
      if (!table) return NextResponse.json({ error: "Mesa no encontrada." }, { status: 404 });
      return NextResponse.json({ table });
    }
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "Ya existe una mesa con ese nombre." }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
