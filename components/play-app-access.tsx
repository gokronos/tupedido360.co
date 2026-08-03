"use client";

import { Building2, LogIn, Store } from "lucide-react";
import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";

export function PlayAppAccess() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <main className="auth-page play-app-auth">
      <section className={`auth-box play-app-auth-box ${view === "register" ? "registering" : ""}`}>
        <div className="auth-brand"><Building2 size={23} /> TuPedido360</div>
        <div className="play-app-trial-note">
          <Store size={23} />
          <div><strong>30 días gratis para su negocio</strong><span>Sin tarjeta, sin cobros y sin renovación automática.</span></div>
        </div>
        <div className="play-app-tabs" role="tablist" aria-label="Acceso a TuPedido360">
          <button type="button" role="tab" aria-selected={view === "login"} className={view === "login" ? "active" : ""} onClick={() => setView("login")}><LogIn size={17} /> Iniciar sesión</button>
          <button type="button" role="tab" aria-selected={view === "register"} className={view === "register" ? "active" : ""} onClick={() => setView("register")}><Store size={17} /> Crear negocio</button>
        </div>
        <div className="auth-heading">
          <h1>{view === "login" ? "Bienvenido de nuevo" : "Cree su negocio"}</h1>
          <p>{view === "login" ? "Ingrese para administrar su negocio." : "Empiece a usar todas las herramientas sin pagar durante 30 días."}</p>
        </div>
        {view === "login" ? <LoginForm /> : <RegisterForm playApp />}
      </section>
    </main>
  );
}
