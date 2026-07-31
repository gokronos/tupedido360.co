import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const destination = process.env.NODE_ENV === "production" ? "https://tupedido360.co/ingresar" : new URL("/ingresar", request.url).toString();
  const response = NextResponse.redirect(destination);
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  return response;
}
