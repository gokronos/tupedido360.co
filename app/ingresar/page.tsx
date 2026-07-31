import { Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { currentSession } from "@/lib/session";

export default async function LoginPage() {
  if (await currentSession()) redirect("/panel");

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
