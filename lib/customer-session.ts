import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type CustomerSession={customerId:string;businessId:string;businessSlug:string;issuedAt:number;expiresAt:number};
const name="tupedido360_customer";
function secret(){const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new Error("SESSION_SECRET inválido.");return value}
function sign(payload:string){return createHmac("sha256",secret()).update(`customer:${payload}`).digest("base64url")}
export function customerToken(session:CustomerSession){const payload=Buffer.from(JSON.stringify(session)).toString("base64url");return `${payload}.${sign(payload)}`}
export function readCustomerToken(token?:string){if(!token)return null;const[payload,provided]=token.split(".");if(!payload||!provided)return null;const expected=Buffer.from(sign(payload));const actual=Buffer.from(provided);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;try{const session=JSON.parse(Buffer.from(payload,"base64url").toString()) as CustomerSession;return session.expiresAt>Date.now()?session:null}catch{return null}}
export async function currentCustomer(){return readCustomerToken((await cookies()).get(name)?.value)}
export const customerCookie={name,options:{httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*180,...(process.env.NODE_ENV==="production"?{domain:".tupedido360.co"}:{})}};
