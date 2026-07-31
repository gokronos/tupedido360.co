import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const expectedEmail = process.env.DEMO_USER_EMAIL?.toLowerCase();
  const expectedPassword = process.env.DEMO_USER_PASSWORD;

  if (!body?.email || !body.password || !expectedEmail || !expectedPassword) {
    return NextResponse.json({ error: "No fue posible iniciar sesión." }, { status: 400 });
  }

  if (body.email.trim().toLowerCase() !== expectedEmail || body.password !== expectedPassword) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, createSessionToken({
    email: expectedEmail,
    name: "Usuario de prueba",
    businessName: "Sazón 360 Demo",
    businessSlug: "sazon-360-demo",
    expiresAt: Date.now() + sessionCookie.options.maxAge * 1000,
  }), sessionCookie.options);
  return response;
}
