import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

async function context() {
  const session = await currentSession();
  if (!session?.businessId || !session.role || !["owner", "admin"].includes(session.role)) return null;
  return { businessId: session.businessId, userId: session.userId, sql: await ensureSchema() };
}

export async function GET() {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "No tienes permiso para administrar el equipo." }, { status: 403 });
  const members = await auth.sql`
    SELECT u.id, u.name, u.email, u.phone, bm.role, bm.active, bm.created_at AS "createdAt"
    FROM business_members bm JOIN users u ON u.id=bm.user_id
    WHERE bm.business_id=${auth.businessId}
    ORDER BY CASE bm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.name`;
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "No tienes permiso para administrar el equipo." }, { status: 403 });
  const body = await request.json().catch(() => null) as { action?: string; id?: string; name?: string; email?: string; phone?: string; password?: string; role?: string } | null;
  if (body?.action === "createEmployee") {
    const name = body.name?.trim(); const email = body.email?.trim().toLowerCase(); const phone = body.phone?.trim(); const password = body.password;
    const role = body.role && ["admin", "cashier", "kitchen", "waiter"].includes(body.role) ? body.role : null;
    if (!name || name.length < 3 || !email || !email.includes("@") || !phone || phone.length < 7 || !password || password.length < 8 || !role) return NextResponse.json({ error: "Revisa los datos del empleado." }, { status: 400 });
    try {
      const passwordHash = await hash(password, 12);
      const [member] = await auth.sql.begin(async (transaction) => {
        const [user] = await transaction`INSERT INTO users (name,email,phone,password_hash) VALUES (${name},${email},${phone},${passwordHash}) RETURNING id,name,email,phone`;
        await transaction`INSERT INTO business_members (business_id,user_id,role) VALUES (${auth.businessId},${user.id},${role})`;
        return [{ ...user, role, active: true }];
      });
      return NextResponse.json({ member }, { status: 201 });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
      throw error;
    }
  }
  if (body?.action === "toggleEmployee" && body.id) {
    if (body.id === auth.userId) return NextResponse.json({ error: "No puedes desactivar tu propia cuenta." }, { status: 400 });
    const [member] = await auth.sql`
      UPDATE business_members SET active=NOT active WHERE business_id=${auth.businessId} AND user_id=${body.id} AND role <> 'owner'
      RETURNING user_id AS id, active`;
    if (!member) return NextResponse.json({ error: "Empleado no encontrado." }, { status: 404 });
    return NextResponse.json({ member });
  }
  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
