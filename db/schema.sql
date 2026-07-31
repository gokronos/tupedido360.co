CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE businesses (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  platform_role TEXT NOT NULL DEFAULT 'user' CHECK (platform_role IN ('user', 'support', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE business_members (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cashier', 'kitchen', 'waiter')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);

CREATE TABLE subscriptions (
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
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);

CREATE TABLE products (
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
);

CREATE TABLE store_banners (
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
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/webp', 'image/jpeg', 'image/png')),
  data BYTEA NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 768000),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, whatsapp)
);

CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL DEFAULT '',
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, address, neighborhood)
);

CREATE TABLE orders (
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
);

CREATE TABLE restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);

ALTER TABLE orders ADD CONSTRAINT orders_table_fk FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price_cop INTEGER NOT NULL CHECK (unit_price_cop >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal_cop INTEGER NOT NULL CHECK (subtotal_cop >= 0)
);

CREATE TABLE order_deletion_log (
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
);

CREATE INDEX business_members_user_idx ON business_members(user_id);
CREATE UNIQUE INDEX users_username_lower_idx ON users(lower(username)) WHERE username IS NOT NULL;
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX categories_business_idx ON categories(business_id, sort_order);
CREATE INDEX products_business_idx ON products(business_id, category_id);
CREATE INDEX media_assets_business_idx ON media_assets(business_id, created_at DESC);
CREATE INDEX customers_business_idx ON customers(business_id, whatsapp);
CREATE INDEX customer_addresses_customer_idx ON customer_addresses(customer_id, last_used_at DESC);
CREATE INDEX orders_business_idx ON orders(business_id, created_at DESC);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_deletion_log_business_idx ON order_deletion_log(business_id, deleted_at DESC);
CREATE INDEX restaurant_tables_business_idx ON restaurant_tables(business_id, active);
