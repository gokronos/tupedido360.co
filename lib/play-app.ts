export const playAppCookie = {
  name: "tupedido360_play_app",
  value: "1",
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...(process.env.NODE_ENV === "production" ? { domain: ".tupedido360.co" } : {}),
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  },
};

export function loginDestination({
  platformRole,
  businessSlug,
  isLocal,
  isPlayApp,
}: {
  platformRole?: string;
  businessSlug: string;
  isLocal: boolean;
  isPlayApp: boolean;
}) {
  if (platformRole === "superadmin") return "/admin";
  if (isPlayApp) return "/panel";
  return isLocal ? `/store/${businessSlug}/admin` : `https://${businessSlug}.tupedido360.co/admin`;
}
