process.env.AUTO_MIGRATE_SCHEMA = "true";
if (process.env.DATABASE_URL_UNPOOLED) process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;

async function main() {
  const { ensureSchema } = await import("../db/client");
  await ensureSchema({ migrate: true });
  console.log("Database schema is up to date.");
  process.exit(0);
}

void main();
