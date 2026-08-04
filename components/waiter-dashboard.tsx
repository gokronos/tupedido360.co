"use client";

import {
  CheckCircle2,
  LogOut,
  Minus,
  Plus,
  Search,
  Send,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { AppSession } from "@/lib/session";
type Product = {
  id: string;
  name: string;
  description: string;
  priceCop: number;
  icon: string;
  imageUrl: string;
  categoryId: string | null;
  categoryName: string | null;
  active: boolean;
  stockQuantity: number | null;
};
type Table = { id: string; name: string; active: boolean };
export type OrderParticipantOption = { id: string; label: string; position: number };
type Cart = Record<string, number>;
const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
export function WaiterDashboard({
  session,
  embedded = false,
  initialTableId = "",
  lockedTableName,
  orderId,
  modal = false,
  cashMode = false,
  orderParticipants = [],
  onOrderSaved,
}: {
  session: AppSession;
  embedded?: boolean;
  initialTableId?: string;
  lockedTableName?: string;
  orderId?: string;
  modal?: boolean;
  cashMode?: boolean;
  orderParticipants?: OrderParticipantOption[];
  onOrderSaved?: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableId, setTableId] = useState(initialTableId);
  const [cart, setCart] = useState<Cart>({});
  const [splitMode, setSplitMode] = useState(orderParticipants.length > 0);
  const [peopleCount, setPeopleCount] = useState(
    Math.max(2, orderParticipants.length),
  );
  const [currentPerson, setCurrentPerson] = useState(0);
  const [personCarts, setPersonCarts] = useState<Cart[]>(() =>
    Array.from({ length: Math.max(2, orderParticipants.length) }, () => ({})),
  );
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const load = useCallback(async () => {
    const [catalogResponse, tablesResponse] = await Promise.all([
      fetch("/api/catalog"),
      fetch("/api/tables"),
    ]);
    const catalog = await catalogResponse.json();
    const tableData = await tablesResponse.json();
    if (catalogResponse.ok)
      setProducts(
        catalog.products.filter(
          (product: Product) =>
            product.active &&
            (product.stockQuantity === null || product.stockQuantity > 0),
        ),
      );
    if (tablesResponse.ok)
      setTables(tableData.tables.filter((table: Table) => table.active));
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    products.forEach((product) => {
      if (product.categoryId && product.categoryName)
        unique.set(product.categoryId, product.categoryName);
    });
    return [...unique].map(([id, name]) => ({ id, name }));
  }, [products]);
  const visible = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = `${product.name} ${product.categoryName ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCategory =
          categoryId === null || product.categoryId === categoryId;
        return matchesSearch && matchesCategory;
      }),
    [products, search, categoryId],
  );
  const activeCart = splitMode ? personCarts[currentPerson] ?? {} : cart;
  const items = products
    .filter((product) => activeCart[product.id])
    .map((product) => ({ ...product, quantity: activeCart[product.id] }));
  const total = items.reduce(
    (sum, item) => sum + item.priceCop * item.quantity,
    0,
  );
  function quantity(id: string, change: number) {
    const product = products.find((candidate) => candidate.id === id);
    const update = (current: Cart) => {
      const maximum = product?.stockQuantity ?? 50;
      const value = Math.min(
        maximum,
        Math.max(0, (current[id] ?? 0) + change),
      );
      const next = { ...current, [id]: value };
      if (!value) delete next[id];
      return next;
    };
    if (splitMode)
      setPersonCarts((current) =>
        current.map((personCart, index) =>
          index === currentPerson ? update(personCart) : personCart,
        ),
      );
    else setCart(update);
  }
  async function submit(fulfillment?: "delivered" | "preparation") {
    const creatingSplitOrder = splitMode && !orderId && !cashMode;
    const missingPerson = creatingSplitOrder
      ? personCarts.findIndex((personCart) => Object.keys(personCart).length === 0)
      : -1;
    if ((!cashMode && !tableId) || !items.length || missingPerson >= 0) {
      setError(
        cashMode
          ? "Agregue al menos un producto."
          : missingPerson >= 0
            ? `Agregue al menos un producto a la Persona ${missingPerson + 1}.`
            : "Selecciona una mesa y agrega productos.",
      );
      return;
    }
    setSending(true);
    setError("");
    try {
      const response = await fetch(
        cashMode ? "/api/cash/orders" : "/api/waiter/orders",
        {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tableId,
          orderId,
          paymentMethod,
          fulfillment,
          notes,
          participantId: orderParticipants[currentPerson]?.id,
          participants: creatingSplitOrder
            ? personCarts.map((personCart, index) => ({
                label: `Persona ${index + 1}`,
                items: Object.entries(personCart).map(([productId, quantity]) => ({ productId, quantity })),
              }))
            : undefined,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "No se pudo guardar la adición.");
      } else {
        setConfirmation(
          cashMode
            ? `Venta ${result.reference} registrada correctamente.`
            : result.reference,
        );
        setCart({});
        setPersonCarts(Array.from({ length: peopleCount }, () => ({})));
        setCurrentPerson(0);
        setNotes("");
        onOrderSaved?.();
      }
    } catch {
      setError("No se pudo conectar para guardar la adición.");
    } finally {
      setSending(false);
    }
  }
  return (
    <main
      className={`waiter-shell${embedded ? " waiter-embedded" : ""}${modal ? " waiter-modal" : ""}${cashMode ? " cash-mode" : ""}`}
    >
      {!embedded && (
        <header>
          <div className="waiter-brand">
            <span>
              <UtensilsCrossed size={21} />
            </span>
            <div>
              <strong>{session.businessName}</strong>
              <small>Mesero · {session.name}</small>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button title="Cerrar sesión">
              <LogOut size={19} />
            </button>
          </form>
        </header>
      )}
      <section className="waiter-main">
        <div className="waiter-top">
          {!orderId && !cashMode && (
            <label>
              <span>Mesa del pedido</span>
              <select
                value={tableId}
                onChange={(event) => setTableId(event.target.value)}
              >
                <option value="">Seleccionar mesa</option>
                {tables.map((table) => (
                  <option value={table.id} key={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!orderId && !cashMode && (
            <div className="split-order-setup">
              <span>Tipo de pedido</span>
              <div>
                <button className={!splitMode ? "active" : ""} onClick={() => setSplitMode(false)}>Normal</button>
                <button className={splitMode ? "active" : ""} onClick={() => setSplitMode(true)}>Por personas</button>
              </div>
              {splitMode && (
                <label>
                  <span>¿Cuántas personas pagan?</span>
                  <input type="number" min={2} max={20} value={peopleCount} onChange={(event) => {
                    const count = Math.max(2, Math.min(20, Math.round(Number(event.target.value) || 2)));
                    setPeopleCount(count);
                    setPersonCarts((current) => Array.from({ length: count }, (_, index) => current[index] ?? {}));
                    setCurrentPerson((current) => Math.min(current, count - 1));
                  }} />
                </label>
              )}
            </div>
          )}
          <label className="waiter-search">
            <span>Buscar producto</span>
            <div>
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o categoría"
              />
            </div>
          </label>
        </div>
        {splitMode && (
          <div className="participant-strip" aria-label="Cuentas del pedido">
            {(orderParticipants.length ? orderParticipants : Array.from({ length: peopleCount }, (_, index) => ({ id: String(index), label: `Persona ${index + 1}`, position: index + 1 }))).map((participant, index) => (
              <button key={participant.id} className={currentPerson === index ? "active" : ""} onClick={() => setCurrentPerson(index)}>
                {participant.label}
                {!orderParticipants.length && Object.keys(personCarts[index] ?? {}).length > 0 && <small>Listo</small>}
              </button>
            ))}
          </div>
        )}
        {categories.length > 0 && (
          <div
            className="waiter-category-strip"
            aria-label="Filtrar productos por categoría"
          >
            <button
              className={categoryId === null ? "active" : ""}
              onClick={() => setCategoryId(null)}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                className={categoryId === category.id ? "active" : ""}
                onClick={() => setCategoryId(category.id)}
                key={category.id}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
        {confirmation && (
          <div className="waiter-confirmation">
            <CheckCircle2 size={20} />
            {cashMode
              ? confirmation
              : `Pedido ${confirmation} enviado a cocina.`}
            <button onClick={() => setConfirmation("")}>Cerrar</button>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="waiter-products">
          {visible.map((product) => (
            <article key={product.id}>
              <span
                className={`waiter-product-icon${product.imageUrl ? " has-image" : ""}`}
              >
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={176}
                    height={164}
                    unoptimized
                  />
                ) : (
                  product.icon || "🍽️"
                )}
              </span>
              <div className="waiter-product-copy">
                <small>{product.categoryName ?? "Sin categoría"}</small>
                <strong>{product.name}</strong>
                <span>{money(product.priceCop)}</span>
                {product.stockQuantity !== null &&
                  product.stockQuantity <= 3 && (
                    <em>Quedan {product.stockQuantity}</em>
                  )}
              </div>
              {activeCart[product.id] ? (
                <div className="quantity-control">
                  <button onClick={() => quantity(product.id, -1)}>
                    <Minus size={16} />
                  </button>
                  <span>{activeCart[product.id]}</span>
                  <button onClick={() => quantity(product.id, 1)}>
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <button
                  className="waiter-add"
                  onClick={() => quantity(product.id, 1)}
                >
                  <Plus size={18} />
                </button>
              )}
            </article>
          ))}
          {!visible.length && (
            <p className="waiter-products-empty">
              No hay productos en esta categoría.
            </p>
          )}
        </div>
      </section>
      <aside className="waiter-cart">
        <div>
          <Store size={19} />
          <strong>
            {cashMode
              ? "Venta rápida"
              : lockedTableName ??
              tables.find((table) => table.id === tableId)?.name ??
                "Sin mesa"}
          </strong>
          {splitMode && <b className="participant-cart-label">{orderParticipants[currentPerson]?.label ?? `Persona ${currentPerson + 1}`}</b>}
          <span>
            {items.reduce((sum, item) => sum + item.quantity, 0)} productos
          </span>
        </div>
        <div className="waiter-cart-lines">
          {items.map((item) => (
            <p key={item.id}>
              <span>
                {item.quantity}x {item.name}
              </span>
              <b>{money(item.priceCop * item.quantity)}</b>
            </p>
          ))}
          {!items.length && (
            <p className="waiter-cart-empty">Agrega productos del menú.</p>
          )}
        </div>
        <label>
          <span>Nota para cocina</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        </label>
        {cashMode && (
          <label>
            <span>Forma de pago</span>
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as "cash" | "transfer")
              }
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
          </label>
        )}
        <footer>
          <div>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          {cashMode ? (
            <div className="cash-sale-actions">
              <button
                disabled={sending || !items.length}
                onClick={() => submit("delivered")}
              >
                <CheckCircle2 size={18} />
                {sending ? "Guardando..." : "Cobrar y entregar"}
              </button>
              <button
                disabled={sending || !items.length}
                onClick={() => submit("preparation")}
              >
                <Send size={18} />
                {sending ? "Guardando..." : "Enviar a preparación"}
              </button>
            </div>
          ) : (
            splitMode && !orderId && currentPerson < peopleCount - 1 ? (
              <button disabled={!items.length} onClick={() => { setError(""); setCurrentPerson((current) => current + 1); }}>
                Siguiente persona
              </button>
            ) : (
              <button disabled={sending || !tableId || !items.length} onClick={() => submit()}>
                <Send size={18} />
                {sending ? "Guardando..." : orderId ? `Guardar adición${splitMode ? ` · ${orderParticipants[currentPerson]?.label ?? `Persona ${currentPerson + 1}`}` : ""}` : splitMode ? "Enviar pedido completo" : "Enviar pedido"}
              </button>
            )
          )}
        </footer>
      </aside>
    </main>
  );
}
