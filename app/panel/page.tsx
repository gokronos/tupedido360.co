import { redirect } from "next/navigation";
import { BusinessDashboard } from "@/components/business-dashboard";
import { currentSession } from "@/lib/session";

export default async function PanelPage() {
  const session = await currentSession();
  if (!session) redirect("/ingresar");
  return <BusinessDashboard session={session} />;
}
