import { Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessDashboard } from "@/components/business-dashboard";
import { LoginForm } from "@/components/login-form";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

export default async function BusinessAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await currentSession();
  if (session?.platformRole === "superadmin") redirect("https://tupedido360.co/admin");
  if (session && session.businessSlug !== slug) {
    const destination = process.env.NODE_ENV === "production" ? `https://${session.businessSlug}.tupedido360.co/admin` : `/store/${session.businessSlug}/admin`;
    redirect(destination);
  }
  if (session) return <BusinessDashboard session={session} />;

  const sql = await ensureSchema();
  const [business] = await sql`SELECT name FROM businesses WHERE slug=${slug} AND status IN ('trial','active')`;
  if (!business) redirect("https://tupedido360.co/ingresar");
  return (
    <main className="auth-page">
      <section className="auth-box">
        <Link className="auth-brand" href="/"><Building2 size={23} /> TuPedido360</Link>
        <div className="auth-heading">
          <h1>Bienvenido de nuevo</h1>
          <p>Ingresa para administrar tu negocio.</p>
        </div>
        <LoginForm />
        <p className="auth-switch">¿Aún no tienes cuenta? <Link href="/">Crear negocio</Link></p>
      </section>
    </main>
  );
}
