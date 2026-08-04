import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";
import { getVapidPublicKey } from "@/lib/push-notifications";

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getVapidPublicKey() });
  } catch {
    return NextResponse.json({ error: "Las notificaciones todavía no están configuradas." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session?.userId || !session?.businessId) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
      nativeToken?: unknown;
      platform?: unknown;
    } | null;
    if (
      typeof body?.nativeToken === "string" &&
      body.nativeToken.length >= 20 &&
      body.nativeToken.length <= 4096 &&
      (body.platform === "android" || body.platform === "ios")
    ) {
      const sql = await ensureSchema();
      await sql`
        INSERT INTO native_push_tokens (business_id,user_id,platform,token)
        VALUES (${session.businessId},${session.userId},${body.platform},${body.nativeToken})
        ON CONFLICT (token) DO UPDATE SET
          business_id=EXCLUDED.business_id,user_id=EXCLUDED.user_id,
          platform=EXCLUDED.platform,updated_at=now()`;
      return NextResponse.json({ ok: true, channel: "native" });
    }
    const { endpoint, keys } = body || {};

    if (typeof endpoint !== "string" || endpoint.length > 2048 ||
        typeof keys?.p256dh !== "string" || keys.p256dh.length > 512 ||
        typeof keys?.auth !== "string" || keys.auth.length > 512) {
      return NextResponse.json({ error: "Datos de suscripción push incompletos." }, { status: 400 });
    }

    const sql = await ensureSchema();

    await sql`
      INSERT INTO push_subscriptions (business_id, user_id, endpoint, p256dh, auth)
      VALUES (${session.businessId}, ${session.userId}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
      ON CONFLICT (endpoint) DO UPDATE
      SET business_id = EXCLUDED.business_id,
          user_id = EXCLUDED.user_id,
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth
    `;

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[Push Subscribe Error]", error);
    const message = error instanceof Error && error.message === "VAPID_NOT_CONFIGURED"
      ? "Las notificaciones todavía no están configuradas."
      : "Error guardando suscripción push.";
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message === "VAPID_NOT_CONFIGURED" ? 503 : 500 });
  }
}
