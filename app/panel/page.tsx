import { redirect } from "next/navigation";
import { currentSession } from "@/lib/session";

export default async function PanelPage() {
  const session = await currentSession();
  if (!session) redirect("/ingresar");
  if (session.platformRole === "superadmin") redirect("/admin");
  const destination = process.env.NODE_ENV === "production" ? `https://${session.businessSlug}.tupedido360.co/admin` : `/store/${session.businessSlug}/admin`;
  redirect(destination);
}
