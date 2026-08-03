"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="es">
      <body>
        <main className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Algo salió mal</h1>
            <p className="mt-2 text-slate-600">El error fue registrado. Puedes intentar nuevamente.</p>
            <button className="mt-5 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white" onClick={reset}>Reintentar</button>
          </div>
        </main>
      </body>
    </html>
  );
}
