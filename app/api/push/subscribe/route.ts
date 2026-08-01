import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";
import { getVapidPublicKey } from "@/lib/push-notifications";

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session?.userId || !session?.businessId) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
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
  } catch (error: any) {
    console.error("[Push Subscribe Error]", error);
    return NextResponse.json({ error: error?.message ?? "Error guardando suscripción push." }, { status: 500 });
  }
}
