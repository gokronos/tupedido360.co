import { NextResponse } from "next/server";

const MAX_REPORT_BYTES = 16 * 1024;
const ALLOWED_FIELDS = new Set(["document-uri", "violated-directive", "effective-directive", "blocked-uri", "source-file", "line-number", "column-number", "disposition"]);

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 });
  try {
    const payload = JSON.parse(raw) as { "csp-report"?: Record<string, unknown> };
    const report = Object.fromEntries(Object.entries(payload["csp-report"] ?? {}).filter(([key]) => ALLOWED_FIELDS.has(key)));
    console.warn("CSP violation", report);
  } catch {
    return NextResponse.json({ error: "Reporte inválido." }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}
