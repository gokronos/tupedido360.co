import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/client";
import { currentCustomer } from "@/lib/customer-session";

export async function GET(request:Request){
  const slug=new URL(request.url).searchParams.get("slug")?.trim().toLowerCase();const session=await currentCustomer();
  if(!slug||!session||session.businessSlug!==slug)return NextResponse.json({customer:null});
  const sql=await ensureSchema();const[customer]=await sql`SELECT name,whatsapp FROM customers WHERE id=${session.customerId} AND business_id=${session.businessId}`;
  if(!customer)return NextResponse.json({customer:null});
  const addresses=await sql`SELECT id,address,neighborhood,reference FROM customer_addresses WHERE customer_id=${session.customerId} ORDER BY last_used_at DESC LIMIT 10`;
  const orders=await sql`SELECT reference,order_type AS "orderType",status,paid,total_cop AS "totalCop",delivery_fee_cop AS "deliveryFeeCop",estimated_minutes AS "estimatedMinutes",created_at AS "createdAt" FROM orders WHERE customer_id=${session.customerId} AND business_id=${session.businessId} AND created_at>=to_timestamp(${session.issuedAt}/1000.0)-interval '5 minutes' ORDER BY created_at DESC LIMIT 30`;
  return NextResponse.json({customer:{name:String(customer.name),whatsapp:String(customer.whatsapp),addresses,orders}});
}
