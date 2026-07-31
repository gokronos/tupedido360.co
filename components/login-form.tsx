"use client";

import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ expectedSlug }: { expectedSlug?: string }) {
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
      body: JSON.stringify({ login: form.get("login"), password: form.get("password"), expectedSlug }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "No fue posible iniciar sesión.");
      setLoading(false);
      return;
    }
    if (result.destination?.startsWith("http://") || result.destination?.startsWith("https://")) {
      window.location.href = result.destination;
    } else {
      router.push(result.destination ?? "/panel");
      router.refresh();
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label><span>Usuario o correo</span><input name="login" type="text" autoComplete="username" required placeholder="Tu usuario o correo" /></label>
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
