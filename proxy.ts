import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rootHosts = new Set(["tupedido360.co", "www.tupedido360.co", "localhost", "127.0.0.1"]);

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!hostname || rootHosts.has(hostname) || hostname.endsWith(".vercel.app")) return NextResponse.next();
  const suffix = ".tupedido360.co";
  if (!hostname.endsWith(suffix)) return NextResponse.next();
  const slug = hostname.slice(0, -suffix.length);
  if (!slug || slug.includes(".")) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/store/${slug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
