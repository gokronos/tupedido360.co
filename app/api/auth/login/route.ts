import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { ensureSchema } from "@/db/client";
import { createSessionToken, sessionCookie } from "@/lib/session";
import {rateLimit,requestIp} from "@/lib/rate-limit";

export async function POST(request: Request) {
  if(!await rateLimit(`login:${requestIp(request)}`,10,15*60_000))return NextResponse.json({error:"Demasiados intentos. Espera 15 minutos."},{status:429});
  const body = await request.json().catch(() => null) as { login?: string; email?: string; password?: string; expectedSlug?: string } | null;
  const expectedEmail = process.env.DEMO_USER_EMAIL?.toLowerCase();
  const expectedPassword = process.env.DEMO_USER_PASSWORD;

  const login = (body?.login ?? body?.email)?.trim().toLowerCase();
  if (!login || !body?.password) {
    return NextResponse.json({ error: "No fue posible iniciar sesión." }, { status: 400 });
  }

  let session;

  if (expectedEmail && expectedPassword && login === expectedEmail && body.password === expectedPassword) {
    session = { email: expectedEmail, name: "Usuario de prueba", businessName: "Sazón 360 Demo", businessSlug: "sazon-360-demo", role: "owner" as const };
  } else if (process.env.DATABASE_URL) {
    const sql = await ensureSchema();
    const targetSlug = body.expectedSlug?.trim().toLowerCase() ?? "";
    const [account] = await sql`
      SELECT u.id AS user_id, u.name, u.email, u.password_hash, u.platform_role,
             b.id AS business_id, b.name AS business_name, b.slug AS business_slug, bm.role
      FROM users u
      LEFT JOIN business_members bm ON bm.user_id = u.id AND bm.active = true
      LEFT JOIN businesses b ON b.id = bm.business_id
      WHERE (lower(u.email) = ${login} OR lower(u.username) = ${login}) AND (u.platform_role='superadmin' OR b.status <> 'cancelled')
      ORDER BY (CASE WHEN b.slug = ${targetSlug} THEN 1 ELSE 0 END) DESC, bm.created_at DESC
      LIMIT 1`;
    if (account && await compare(body.password, String(account.password_hash))) {
      session = { userId:String(account.user_id),email:String(account.email),name:String(account.name),businessName:account.business_name?String(account.business_name):"TuPedido360",businessSlug:account.business_slug?String(account.business_slug):"",...(account.business_id?{businessId:String(account.business_id)}:{}),...(account.role?{role:String(account.role) as "owner"|"admin"|"cashier"|"kitchen"|"waiter"}:{}),platformRole:String(account.platform_role) as "user"|"support"|"superadmin" };
    }
  }

  if (!session) return NextResponse.json({ error: "Usuario, correo o contraseña incorrectos." }, { status: 401 });
  const expectedSlug = body.expectedSlug?.trim().toLowerCase();
  if (expectedSlug && session.businessSlug !== expectedSlug && session.platformRole !== "superadmin") return NextResponse.json({ error: "Esta cuenta pertenece a otro negocio." }, { status: 403 });

  const hostname = new URL(request.url).hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const destination = session.platformRole === "superadmin" ? "/admin" : isLocal ? `/store/${session.businessSlug}/admin` : `https://${session.businessSlug}.tupedido360.co/admin`;

  const response = NextResponse.json({ ok: true, destination });
  response.cookies.set(sessionCookie.name, createSessionToken({
    ...session,
    expiresAt: Date.now() + sessionCookie.options.maxAge * 1000,
  }), sessionCookie.options);
  return response;
}
