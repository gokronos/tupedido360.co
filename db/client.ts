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
        description TEXT NOT NULL DEFAULT '',
        logo_url TEXT NOT NULL DEFAULT '',
        primary_color TEXT NOT NULL DEFAULT '#176b4d',
        accent_color TEXT NOT NULL DEFAULT '#d6f35c',
        address TEXT NOT NULL DEFAULT '',
        public_phone TEXT NOT NULL DEFAULT '',
        whatsapp TEXT NOT NULL DEFAULT '',
        menu_template TEXT NOT NULL DEFAULT 'classic',
        logo_size INTEGER NOT NULL DEFAULT 72 CHECK (logo_size BETWEEN 48 AND 96),
        accepting_orders BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#176b4d'`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#d6f35c'`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS public_phone TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS menu_template TEXT NOT NULL DEFAULT 'classic'`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_size INTEGER NOT NULL DEFAULT 72`;
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS accepting_orders BOOLEAN NOT NULL DEFAULT true`;
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        username TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        platform_role TEXT NOT NULL DEFAULT 'user' CHECK (platform_role IN ('user', 'support', 'superadmin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`;
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
        is_lifetime BOOLEAN NOT NULL DEFAULT false,
        trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
        current_period_ends_at TIMESTAMPTZ,
        payment_provider TEXT,
        provider_customer_id TEXT,
        provider_subscription_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN NOT NULL DEFAULT false`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users(lower(username)) WHERE username IS NOT NULL`;
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (business_id, name)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price_cop INTEGER NOT NULL CHECK (price_cop >= 0),
        packaging_fee_cop INTEGER NOT NULL DEFAULT 0 CHECK (packaging_fee_cop >= 0),
        icon TEXT NOT NULL DEFAULT '🍽️',
        image_url TEXT NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_fee_cop INTEGER NOT NULL DEFAULT 0 CHECK (packaging_fee_cop >= 0)`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT '🍽️'`;
    await sql`
      CREATE TABLE IF NOT EXISTS store_banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        eyebrow TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS store_banners_business_idx ON store_banners(business_id, sort_order)`;
    await sql`
      CREATE TABLE IF NOT EXISTS business_hours (
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
        enabled BOOLEAN NOT NULL DEFAULT true,
        open_time TIME NOT NULL DEFAULT '08:00',
        close_time TIME NOT NULL DEFAULT '22:00',
        PRIMARY KEY (business_id, weekday)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        mime_type TEXT NOT NULL CHECK (mime_type IN ('image/webp', 'image/jpeg', 'image/png')),
        data BYTEA NOT NULL,
        size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 768000),
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (business_id, whatsapp)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        address TEXT NOT NULL,
        neighborhood TEXT NOT NULL DEFAULT '',
        reference TEXT NOT NULL DEFAULT '',
        last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (customer_id, address, neighborhood)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        reference TEXT NOT NULL UNIQUE,
        order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup', 'dine_in')),
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        delivery_address TEXT NOT NULL DEFAULT '',
        neighborhood TEXT NOT NULL DEFAULT '',
        address_reference TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'accepted', 'preparing', 'ready', 'on_way', 'delivered', 'cancelled')),
        paid BOOLEAN NOT NULL DEFAULT false,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        delivery_fee_cop INTEGER CHECK (delivery_fee_cop >= 0),
        delivery_quote_status TEXT NOT NULL DEFAULT 'not_applicable',
        estimated_minutes INTEGER CHECK (estimated_minutes BETWEEN 5 AND 240),
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        deleted_at TIMESTAMPTZ,
        deleted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        deletion_reason TEXT NOT NULL DEFAULT '',
        table_id UUID,
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        total_cop INTEGER NOT NULL CHECK (total_cop >= 0),
        packaging_total_cop INTEGER NOT NULL DEFAULT 0 CHECK (packaging_total_cop >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging_total_cop INTEGER NOT NULL DEFAULT 0 CHECK (packaging_total_cop >= 0)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS neighborhood TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_reference TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee_cop INTEGER CHECK (delivery_fee_cop >= 0)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_quote_status TEXT NOT NULL DEFAULT 'not_applicable'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER CHECK (estimated_minutes BETWEEN 5 AND 240)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deletion_reason TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`;
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_status_v3_check') THEN
          ALTER TABLE orders ADD CONSTRAINT orders_status_v3_check CHECK (status IN ('received','accepted','preparing','ready','on_way','delivered','cancelled'));
        END IF;
      END $$`;
    await sql`
      CREATE TABLE IF NOT EXISTS restaurant_tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (business_id, name)
      )`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check`;
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_order_type_v2_check') THEN
          ALTER TABLE orders ADD CONSTRAINT orders_order_type_v2_check CHECK (order_type IN ('delivery', 'pickup', 'dine_in'));
        END IF;
      END $$`;
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        unit_price_cop INTEGER NOT NULL CHECK (unit_price_cop >= 0),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        subtotal_cop INTEGER NOT NULL CHECK (subtotal_cop >= 0)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS order_deletion_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        order_reference TEXT NOT NULL,
        reason TEXT NOT NULL,
        deleted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        deleted_by_name TEXT NOT NULL,
        deleted_by_role TEXT NOT NULL,
        order_snapshot JSONB NOT NULL,
        tenant_purged_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`ALTER TABLE order_deletion_log ADD COLUMN IF NOT EXISTS tenant_purged_at TIMESTAMPTZ`;
    await sql`CREATE INDEX IF NOT EXISTS business_members_user_idx ON business_members(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS categories_business_idx ON categories(business_id, sort_order)`;
    await sql`CREATE INDEX IF NOT EXISTS products_business_idx ON products(business_id, category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS media_assets_business_idx ON media_assets(business_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS customers_business_idx ON customers(business_id, whatsapp)`;
    await sql`CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx ON customer_addresses(customer_id, last_used_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS orders_business_idx ON orders(business_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS order_deletion_log_business_idx ON order_deletion_log(business_id, deleted_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS restaurant_tables_business_idx ON restaurant_tables(business_id, active)`;
  })();

  try {
    await schemaReady;
  } catch (error) {
    schemaReady = undefined;
    throw error;
  }
  return sql;
}
