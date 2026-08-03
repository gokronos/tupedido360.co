"use client";
import { Plus, Power, Store, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useBackDismiss } from "@/components/use-back-dismiss";
type Table = { id: string; name: string; active: boolean };
export function TablesManager() {
  const [tables, setTables] = useState<Table[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  useBackDismiss(creating, () => setCreating(false));
  const load = useCallback(async () => {
    const response = await fetch("/api/tables");
    const result = await response.json();
    if (response.ok) setTables(result.tables);
    else setError(result.error);
    setLoading(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  async function action(payload: Record<string, unknown>) {
    setError("");
    const response = await fetch("/api/tables", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return false;
    }
    await load();
    return true;
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    if (await action({ action: "createTable", name })) setCreating(false);
  }
  return (
    <div>
      <div className="manager-heading">
        <div>
          <h2>Mesas del local</h2>
          <p>El mesero seleccionará una mesa antes de tomar el pedido.</p>
        </div>
        <button className="primary-compact" onClick={() => setCreating(true)}>
          <Plus size={18} />
          Nueva mesa
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <div className="catalog-loading">Cargando mesas...</div>
      ) : (
        <div className="tables-grid">
          {tables.map((table) => (
            <article className={!table.active ? "disabled" : ""} key={table.id}>
              <Store size={25} />
              <strong>{table.name}</strong>
              <span>{table.active ? "Disponible" : "Inactiva"}</span>
              <button
                title={table.active ? "Desactivar mesa" : "Activar mesa"}
                onClick={() => action({ action: "toggleTable", id: table.id })}
              >
                <Power size={18} />
              </button>
            </article>
          ))}
          {!tables.length && (
            <section className="empty-orders">
              <Store size={30} />
              <h3>Crea la primera mesa</h3>
              <p>Las mesas activas aparecerán en el celular de los meseros.</p>
            </section>
          )}
        </div>
      )}
      {creating && (
        <div
          className="editor-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreating(false);
          }}
        >
          <form className="small-editor" onSubmit={create}>
            <header>
              <div>
                <h2>Nueva mesa</h2>
                <p>Usa un nombre corto que el equipo reconozca.</p>
              </div>
              <button type="button" onClick={() => setCreating(false)}>
                <X size={19} />
              </button>
            </header>
            <label>
              <span>Nombre o número</span>
              <input
                name="name"
                required
                minLength={1}
                maxLength={40}
                autoFocus
                placeholder="Ej. Mesa 8"
              />
            </label>
            <footer>
              <button
                className="secondary-action"
                type="button"
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
              <button className="primary-compact">Crear mesa</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
