CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  timezone TEXT NOT NULL DEFAULT 'America/Bogota',
  currency TEXT NOT NULL DEFAULT 'COP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
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
  image_url TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX business_members_user_idx ON business_members(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX categories_business_idx ON categories(business_id, sort_order);
CREATE INDEX products_business_idx ON products(business_id, category_id);
