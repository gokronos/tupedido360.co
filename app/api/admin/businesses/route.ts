import {NextResponse} from "next/server";
import {ensureSchema} from "@/db/client";
import {currentSession} from "@/lib/session";

export async function POST(request:Request){const session=await currentSession();if(session?.platformRole!=="superadmin")return NextResponse.json({error:"Acceso exclusivo del administrador general."},{status:403});const body=await request.json().catch(()=>null) as {action?:string;id?:string}|null;if(!body?.id)return NextResponse.json({error:"Negocio inválido."},{status:400});const sql=await ensureSchema();
 if(body.action==="toggleLifetime"){const[row]=await sql`UPDATE subscriptions SET is_lifetime=NOT is_lifetime,status=CASE WHEN NOT is_lifetime THEN 'active' ELSE status END,updated_at=now() WHERE business_id=${body.id} RETURNING is_lifetime AS "isLifetime"`;if(!row)return NextResponse.json({error:"Suscripción no encontrada."},{status:404});await sql`UPDATE businesses SET status=CASE WHEN ${row.isLifetime} THEN 'active' ELSE status END,updated_at=now() WHERE id=${body.id}`;return NextResponse.json({ok:true})}
 if(body.action==="extendTrial"){const[row]=await sql`UPDATE subscriptions SET status='trialing',is_lifetime=false,trial_ends_at=GREATEST(trial_ends_at,now())+interval '30 days',updated_at=now() WHERE business_id=${body.id} RETURNING trial_ends_at AS "trialEndsAt"`;if(!row)return NextResponse.json({error:"Suscripción no encontrada."},{status:404});await sql`UPDATE businesses SET status='trial',updated_at=now() WHERE id=${body.id}`;return NextResponse.json({ok:true})}
  if(body.action==="renewSubscription"){
    const months = Number((body as Record<string, unknown>).months);
    if (![1, 3, 6, 12].includes(months)) return NextResponse.json({ error: "Duración de plan inválida." }, { status: 400 });
    const [row] = await sql`
      UPDATE subscriptions
      SET status='active', is_lifetime=false,
          current_period_ends_at = GREATEST(COALESCE(current_period_ends_at, trial_ends_at, now()), now()) + (${months} || ' months')::interval,
          updated_at=now()
      WHERE business_id=${body.id}
      RETURNING current_period_ends_at AS "currentPeriodEndsAt"`;
    if (!row) return NextResponse.json({ error: "Suscripción no encontrada." }, { status: 404 });
    await sql`UPDATE businesses SET status='active', updated_at=now() WHERE id=${body.id}`;
    return NextResponse.json({ ok: true });
  }
 if(body.action==="toggleSuspended"){const[business]=await sql`UPDATE businesses SET status=CASE WHEN status='suspended' THEN 'active' ELSE 'suspended' END,updated_at=now() WHERE id=${body.id} RETURNING status`;if(!business)return NextResponse.json({error:"Negocio no encontrado."},{status:404});return NextResponse.json({ok:true})}
 return NextResponse.json({error:"Acción no reconocida."},{status:400})}
