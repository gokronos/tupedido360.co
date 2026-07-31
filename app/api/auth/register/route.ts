import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { createSessionToken, sessionCookie } from "@/lib/session";
import {rateLimit,requestIp} from "@/lib/rate-limit";

export const runtime = "nodejs";

type Registration = { ownerName?: string; phone?: string; email?: string; businessName?: string; slug?: string; password?: string };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedSlugs = new Set(["www", "app", "api", "admin", "panel", "soporte", "support", "login", "ingresar"]);

export async function POST(request: Request) {
  if(!rateLimit(`register:${requestIp(request)}`,5,60*60_000))return NextResponse.json({error:"Demasiados registros. Intenta más tarde."},{status:429});
  const body = await request.json().catch(() => null) as Registration | null;
  const ownerName = body?.ownerName?.trim();
  const phone = body?.phone?.trim();
  const email = body?.email?.trim().toLowerCase();
  const businessName = body?.businessName?.trim();
  const slug = body?.slug?.trim().toLowerCase();
  const password = body?.password;

  if (!ownerName || ownerName.length < 3 || !phone || phone.length < 7 || !email || !email.includes("@") || !businessName || businessName.length < 2 || !slug || !slugPattern.test(slug) || !password || password.length < 8) {
    return NextResponse.json({ error: "Revisa los datos obligatorios del formulario." }, { status: 400 });
  }
  if (reservedSlugs.has(slug)) return NextResponse.json({ error: "Esa dirección está reservada. Elige otra." }, { status: 409 });

  try {
    const sql = await ensureSchema();
    const passwordHash = await hash(password, 12);
    const account = await sql.begin(async (transaction) => {
      const [user] = await transaction`
        INSERT INTO users (name, email, phone, password_hash)
        VALUES (${ownerName}, ${email}, ${phone}, ${passwordHash})
        RETURNING id`;
      const [business] = await transaction`
        INSERT INTO businesses (name, slug)
        VALUES (${businessName}, ${slug})
        RETURNING id`;
      await transaction`INSERT INTO business_members (business_id, user_id, role) VALUES (${business.id}, ${user.id}, 'owner')`;
      await transaction`INSERT INTO subscriptions (business_id) VALUES (${business.id})`;
      await transaction`INSERT INTO business_hours(business_id,weekday,enabled,open_time,close_time) SELECT ${business.id},day,true,'08:00','22:00' FROM generate_series(0,6) AS day`;
      return { userId: String(user.id), businessId: String(business.id) };
    });

    const response = NextResponse.json({ ok: true, redirectTo: "/panel" }, { status: 201 });
    response.cookies.set(sessionCookie.name, createSessionToken({
      userId: account.userId,
      businessId: account.businessId,
      email,
      name: ownerName,
      businessName,
      businessSlug: slug,
      role: "owner",
      platformRole: "user",
      expiresAt: Date.now() + sessionCookie.options.maxAge * 1000,
    }), sessionCookie.options);
    return response;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "El correo o la dirección del negocio ya están registrados." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "DATABASE_URL_NOT_CONFIGURED") {
      return NextResponse.json({ error: "La base de datos aún no está conectada." }, { status: 503 });
    }
    console.error("Registration failed", error);
    return NextResponse.json({ error: "No fue posible crear el negocio. Intenta nuevamente." }, { status: 500 });
  }
}
