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
