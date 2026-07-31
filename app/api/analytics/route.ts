import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentSession } from "@/lib/session";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session?.businessId || !session.role) return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  if (!["owner", "admin", "cashier"].includes(session.role)) return NextResponse.json({ error: "No tienes permiso para consultar ventas." }, { status: 403 });
  const url = new URL(request.url);
  const preset = url.searchParams.get("preset") ?? "today";
  const days = { today: 1, week: 7, fortnight: 15, month: 30 }[preset as "today" | "week" | "fortnight" | "month"];
  let from = url.searchParams.get("from");
  let to = url.searchParams.get("to");
  if (preset !== "custom") { from = null; to = null; }
  if (preset === "custom" && (!from || !to || !datePattern.test(from) || !datePattern.test(to) || from > to)) return NextResponse.json({ error: "Selecciona un rango de fechas válido." }, { status: 400 });
  if (!days && preset !== "custom") return NextResponse.json({ error: "Periodo inválido." }, { status: 400 });

  const sql = await ensureSchema();
  const [business] = await sql`SELECT timezone FROM businesses WHERE id=${session.businessId}`;
  const timezone = String(business?.timezone ?? "America/Bogota");
  const bounds = preset === "custom"
    ? [{ from: from!, to: to! }]
    : await sql`SELECT to_char((now() AT TIME ZONE ${timezone})::date - ${(days ?? 1) - 1}::int,'YYYY-MM-DD') AS "from", to_char((now() AT TIME ZONE ${timezone})::date,'YYYY-MM-DD') AS "to"`;
  const start = String(bounds[0].from);
  const end = String(bounds[0].to);

  const [summary] = await sql`
    SELECT COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS "orderCount",
      COALESCE(SUM(total_cop) FILTER (WHERE status <> 'cancelled'),0)::int AS "totalSalesCop",
      COALESCE(AVG(total_cop) FILTER (WHERE status <> 'cancelled'),0)::int AS "averageTicketCop",
      COALESCE(SUM(total_cop) FILTER (WHERE status <> 'cancelled' AND paid),0)::int AS "paidSalesCop",
      COALESCE(SUM(total_cop) FILTER (WHERE status <> 'cancelled' AND NOT paid),0)::int AS "pendingSalesCop",
      COALESCE(SUM(packaging_total_cop) FILTER (WHERE status <> 'cancelled'),0)::int AS "packagingSalesCop",
      COALESCE(SUM(delivery_fee_cop) FILTER (WHERE status <> 'cancelled'),0)::int AS "deliverySalesCop",
      COUNT(*) FILTER (WHERE status='cancelled')::int AS "cancelledCount"
    FROM orders WHERE business_id=${session.businessId}
      AND (created_at AT TIME ZONE ${timezone})::date BETWEEN ${start}::date AND ${end}::date`;
  const products = await sql`
    SELECT oi.product_name AS name,SUM(oi.quantity)::int AS quantity,SUM(oi.subtotal_cop)::int AS "salesCop"
    FROM order_items oi JOIN orders o ON o.id=oi.order_id
    WHERE o.business_id=${session.businessId} AND o.status<>'cancelled'
      AND (o.created_at AT TIME ZONE ${timezone})::date BETWEEN ${start}::date AND ${end}::date
    GROUP BY oi.product_name ORDER BY quantity DESC,"salesCop" DESC LIMIT 20`;
  const daily = await sql`
    SELECT (created_at AT TIME ZONE ${timezone})::date::text AS date,COUNT(*)::int AS orders,COALESCE(SUM(total_cop),0)::int AS "salesCop"
    FROM orders WHERE business_id=${session.businessId} AND status<>'cancelled'
      AND (created_at AT TIME ZONE ${timezone})::date BETWEEN ${start}::date AND ${end}::date
    GROUP BY 1 ORDER BY 1`;
  const history = await sql`
    SELECT reference,order_type AS "orderType",customer_name AS "customerName",status,paid,total_cop AS "totalCop",created_at AS "createdAt"
    FROM orders WHERE business_id=${session.businessId}
      AND (created_at AT TIME ZONE ${timezone})::date BETWEEN ${start}::date AND ${end}::date
    ORDER BY created_at DESC LIMIT 100`;
  return NextResponse.json({ period: { from: start, to: end }, summary, products, daily, history });
}
