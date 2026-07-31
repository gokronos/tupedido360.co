import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { ensureSchema } from "@/db/client";
import { createSessionToken, sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const expectedEmail = process.env.DEMO_USER_EMAIL?.toLowerCase();
  const expectedPassword = process.env.DEMO_USER_PASSWORD;

  if (!body?.email || !body.password) {
    return NextResponse.json({ error: "No fue posible iniciar sesión." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  let session;

  if (expectedEmail && expectedPassword && email === expectedEmail && body.password === expectedPassword) {
    session = { email: expectedEmail, name: "Usuario de prueba", businessName: "Sazón 360 Demo", businessSlug: "sazon-360-demo", role: "owner" as const };
  } else if (process.env.DATABASE_URL) {
    const sql = await ensureSchema();
    const [account] = await sql`
      SELECT u.id AS user_id, u.name, u.email, u.password_hash,
             b.id AS business_id, b.name AS business_name, b.slug AS business_slug, bm.role
      FROM users u
      JOIN business_members bm ON bm.user_id = u.id AND bm.active = true
      JOIN businesses b ON b.id = bm.business_id
      WHERE u.email = ${email} AND b.status <> 'cancelled'
      ORDER BY bm.created_at ASC
      LIMIT 1`;
    if (account && await compare(body.password, String(account.password_hash))) {
      session = {
        userId: String(account.user_id), businessId: String(account.business_id), email: String(account.email),
        name: String(account.name), businessName: String(account.business_name), businessSlug: String(account.business_slug),
        role: String(account.role) as "owner" | "admin" | "cashier" | "kitchen" | "waiter",
      };
    }
  }

  if (!session) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, createSessionToken({
    ...session,
    expiresAt: Date.now() + sessionCookie.options.maxAge * 1000,
  }), sessionCookie.options);
  return response;
}
