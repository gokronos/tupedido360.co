import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { playAppCookie } from "@/lib/play-app";
import { sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const isPlayApp = (await cookies()).get(playAppCookie.name)?.value === playAppCookie.value;
  const path = isPlayApp ? "/acceso-app" : "/ingresar";
  const destination = process.env.NODE_ENV === "production" ? `https://tupedido360.co${path}` : new URL(path, request.url).toString();
  const response = NextResponse.redirect(destination);
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  return response;
}
