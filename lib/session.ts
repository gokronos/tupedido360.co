import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ensureSchema } from "@/db/client";

const COOKIE_NAME = "tupedido360_session";

export type AppSession = {
  userId?: string;
  businessId?: string;
  email: string;
  name: string;
  businessName: string;
  businessSlug: string;
  role?: "owner" | "admin" | "cashier" | "kitchen" | "waiter";
  platformRole?: "user" | "support" | "superadmin";
  sessionVersion?: number;
  expiresAt: number;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(session: AppSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readSessionToken(token?: string): AppSession | null {
  if (!token) return null;
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature) return null;

  const expectedSignature = signature(payload);
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AppSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function currentSession() {
  const session = readSessionToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!session || !session.userId || !process.env.DATABASE_URL) return session;
  const sql = await ensureSchema();
  if (session.platformRole === "superadmin") {
    const [user] = await sql`SELECT session_version FROM users WHERE id=${session.userId} AND platform_role='superadmin'`;
    return user && Number(user.session_version) === (session.sessionVersion ?? 0) ? session : null;
  }
  if (!session.businessId) return null;
  const [membership] = await sql`
    SELECT bm.role,b.name AS "businessName",b.slug AS "businessSlug",u.session_version AS "sessionVersion"
    FROM business_members bm JOIN businesses b ON b.id=bm.business_id JOIN users u ON u.id=bm.user_id
    WHERE bm.user_id=${session.userId} AND bm.business_id=${session.businessId}
      AND bm.active=true AND b.status<>'cancelled'`;
  if (!membership) return null;
  if (Number(membership.sessionVersion) !== (session.sessionVersion ?? 0)) return null;
  return {
    ...session,
    role: String(membership.role) as AppSession["role"],
    businessName: String(membership.businessName),
    businessSlug: String(membership.businessSlug),
  };
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...(process.env.NODE_ENV === "production" ? { domain: ".tupedido360.co" } : {}),
    path: "/",
    maxAge: 60 * 60 * 12,
  },
};
