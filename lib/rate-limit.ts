import { database, ensureSchema } from "@/db/client";

type Entry = { count: number; resetAt: number };
const localBuckets = new Map<string, Entry>();

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export async function rateLimit(key: string, limit: number, windowMs: number) {
  if (database()) {
    const sql = await ensureSchema();
    const [bucket] = await sql`
      INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
      VALUES (${key}, 1, now() + (${windowMs} || ' milliseconds')::interval)
      ON CONFLICT (bucket_key) DO UPDATE SET
        count=CASE WHEN rate_limit_buckets.reset_at <= now() THEN 1 ELSE rate_limit_buckets.count + 1 END,
        reset_at=CASE WHEN rate_limit_buckets.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limit_buckets.reset_at END
      RETURNING count`;
    return Number(bucket.count) <= limit;
  }

  const now = Date.now();
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
