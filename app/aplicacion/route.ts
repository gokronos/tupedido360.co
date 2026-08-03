import { NextResponse } from "next/server";
import { playAppCookie } from "@/lib/play-app";
import { currentSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await currentSession();
  const destination = session ? "/panel" : "/acceso-app";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(playAppCookie.name, playAppCookie.value, playAppCookie.options);
  return response;
}
