"use client";

import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "No fue posible iniciar sesión.");
      setLoading(false);
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required placeholder="nombre@correo.com" /></label>
      <label>
        <span>Contraseña</span>
        <div className="password-input">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Tu contraseña" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
        </div>
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" disabled={loading} type="submit">{loading ? "Ingresando..." : "Ingresar"}<ArrowRight size={19} /></button>
    </form>
  );
}
