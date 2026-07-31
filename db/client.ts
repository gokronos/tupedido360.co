import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;
let schemaReady: Promise<void> | undefined;

export function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  client ??= postgres(connectionString, { max: 5, idle_timeout: 20, connect_timeout: 10 });
  return client;
}

export async function ensureSchema() {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL_NOT_CONFIGURED");

  schemaReady ??= (async () => {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    await sql`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
        status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
        timezone TEXT NOT NULL DEFAULT 'America/Bogota',
        currency TEXT NOT NULL DEFAULT 'COP',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        platform_role TEXT NOT NULL DEFAULT 'user' CHECK (platform_role IN ('user', 'support', 'superadmin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS business_members (
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cashier', 'kitchen', 'waiter')),
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (business_id, user_id)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled')),
        monthly_price_cop INTEGER NOT NULL DEFAULT 30000,
        trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
        current_period_ends_at TIMESTAMPTZ,
        payment_provider TEXT,
        provider_customer_id TEXT,
        provider_subscription_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS business_members_user_idx ON business_members(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status)`;
  })();

  try {
    await schemaReady;
  } catch (error) {
    schemaReady = undefined;
    throw error;
  }
  return sql;
}
