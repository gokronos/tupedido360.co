"use client";

import { ArrowRight, Eye, EyeOff, Store } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function RegisterForm() {
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const suggestedSlug = useMemo(() => slugify(businessName), [businessName]);
  const currentSlug = slugEdited ? slugify(slug) : suggestedSlug;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="success-state" role="status">
        <span><Store size={28} /></span>
        <h3>La base de tu negocio está lista</h3>
        <p>El registro ya funciona visualmente. Conectaremos la base de datos antes de guardar cuentas reales.</p>
        <button type="button" onClick={() => setSubmitted(false)}>Volver al formulario</button>
      </div>
    );
  }

  return (
    <form className="register-form" onSubmit={submit}>
      <div className="field-row">
        <label>
          <span>Nombre del propietario</span>
          <input name="ownerName" autoComplete="name" required placeholder="Tu nombre completo" />
        </label>
        <label>
          <span>Celular</span>
          <input name="phone" type="tel" autoComplete="tel" required placeholder="300 000 0000" />
        </label>
      </div>

      <label>
        <span>Correo electrónico</span>
        <input name="email" type="email" autoComplete="email" required placeholder="nombre@correo.com" />
      </label>

      <label>
        <span>Nombre del negocio</span>
        <input
          name="businessName"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          required
          placeholder="Ej. Sazón de casa"
        />
      </label>

      <label>
        <span>Dirección de tu negocio en internet</span>
        <div className="domain-input">
          <input
            name="slug"
            value={slugEdited ? slug : suggestedSlug}
            onChange={(event) => { setSlugEdited(true); setSlug(event.target.value); }}
            required
            pattern="[a-z0-9-]+"
            placeholder="mi-negocio"
          />
          <span>.tupedido360.co</span>
        </div>
        <small>{currentSlug ? `${currentSlug}.tupedido360.co` : "Esta será la dirección que compartirás con tus clientes."}</small>
      </label>

      <label>
        <span>Contraseña</span>
        <div className="password-input">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required placeholder="Mínimo 8 caracteres" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </label>

      <label className="terms">
        <input type="checkbox" required />
        <span>Acepto los términos del servicio y la política de tratamiento de datos.</span>
      </label>

      <button className="primary-action" type="submit">
        Crear negocio <ArrowRight size={19} />
      </button>

      <p className="billing-copy">Primer mes sin costo. Después, <strong>$30.000 COP al mes</strong>.</p>
      <p className="login-copy">¿Ya tienes una cuenta? <a href="/ingresar">Iniciar sesión</a></p>
    </form>
  );
}
