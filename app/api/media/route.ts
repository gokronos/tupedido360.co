import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

export const runtime = "nodejs";
const MAX_BYTES = 750 * 1024;
const signatures: Record<string, (data: Buffer) => boolean> = {
  "image/webp": (data) => data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP",
  "image/jpeg": (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  "image/png": (data) => data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
};

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session?.businessId || !session.userId) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  if (!session.role || !["owner", "admin"].includes(session.role)) return NextResponse.json({ error: "No tienes permiso para cargar fotos." }, { status: 403 });
  const body = await request.json().catch(() => null) as { dataUrl?: unknown } | null;
  const match = typeof body?.dataUrl === "string" ? body.dataUrl.match(/^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/) : null;
  if (!match) return NextResponse.json({ error: "La foto tiene un formato no permitido." }, { status: 400 });
  const mimeType = match[1];
  const data = Buffer.from(match[2], "base64");
  if (!data.length || data.length > MAX_BYTES || !signatures[mimeType]?.(data)) return NextResponse.json({ error: "La foto no es válida o supera 750 KB." }, { status: 400 });
  const sql = await ensureSchema();
  const [asset] = await sql`
    INSERT INTO media_assets (business_id, mime_type, data, size_bytes, created_by_user_id)
    VALUES (${session.businessId}, ${mimeType}, ${data}, ${data.length}, ${session.userId})
    RETURNING id`;
  return NextResponse.json({ url: `/api/media/${asset.id}` }, { status: 201 });
}
