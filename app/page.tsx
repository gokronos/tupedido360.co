import { Building2, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function Home() {
  return (
    <main className="register-shell">
      <aside className="brand-panel">
        <Link className="platform-brand" href="/" aria-label="TuPedido360, inicio">
          <span className="brand-mark"><Building2 size={24} /></span>
          <span>TuPedido360</span>
        </Link>

        <div className="brand-copy">
          <p className="eyebrow">Tu negocio comienza aquí</p>
          <h1>Administra pedidos, personal y ventas en un solo lugar.</h1>
          <ul>
            <li><Check size={18} /> Pedidos de mesa registrados por tu equipo</li>
            <li><Check size={18} /> Domicilios y pedidos para llevar</li>
            <li><Check size={18} /> Un panel independiente para tu negocio</li>
          </ul>
        </div>

        <p className="company-note">Un producto de <a href="https://imagenplus.co">Imagen Plus</a></p>
      </aside>

      <section className="form-panel">
        <div className="mobile-brand"><Building2 size={21} /> TuPedido360</div>
        <div className="form-wrap">
          <div className="form-heading">
            <span className="trial-pill">30 días gratis</span>
            <h2>Crea tu negocio</h2>
            <p>Configura tu cuenta principal. No necesitas tarjeta para comenzar.</p>
          </div>

          <RegisterForm />

          <div className="trust-note">
            <ShieldCheck size={18} />
            <span>Tus datos y los de cada negocio permanecen separados y protegidos.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
