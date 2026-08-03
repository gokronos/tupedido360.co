import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BusinessDashboard } from "@/components/business-dashboard";
import { playAppCookie } from "@/lib/play-app";
import { currentSession } from "@/lib/session";

export default async function PanelPage() {
  const session = await currentSession();
  const isPlayApp = (await cookies()).get(playAppCookie.name)?.value === playAppCookie.value;
  if (!session) redirect(isPlayApp ? "/acceso-app" : "/ingresar");
  if (session.platformRole === "superadmin") redirect("/admin");
  if (isPlayApp) return <BusinessDashboard session={session} playApp />;
  const destination = process.env.NODE_ENV === "production" ? `https://${session.businessSlug}.tupedido360.co/admin` : `/store/${session.businessSlug}/admin`;
  redirect(destination);
}
