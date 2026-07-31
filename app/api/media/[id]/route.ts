import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.test(id)) return new NextResponse(null, { status: 404 });
  const sql = await ensureSchema();
  const [asset] = await sql`SELECT mime_type AS "mimeType", data FROM media_assets WHERE id=${id}`;
  if (!asset) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(asset.data as Uint8Array), { headers: { "content-type": String(asset.mimeType), "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
