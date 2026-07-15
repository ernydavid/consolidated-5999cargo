import { resolve } from "node:path";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDb } from "../db";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

async function main() {
  const connectionString = env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL;
  const { db, close } = createDb(connectionString);

  try {
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL or DATABASE_MIGRATION_URL.");
    }

    const migrationsFolder = resolve(process.cwd(), "db/migrations");

    logger.info("Running database migrations", {
      migrationsFolder,
      usingMigrationUrl: Boolean(env.DATABASE_MIGRATION_URL),
    });

    await migrate(db, {
      migrationsFolder,
    });

    logger.info("Database migrations completed", {
      migrationsFolder,
    });
  } finally {
    await close();
  }
}

main().catch((error) => {
  logger.error("Database migrations failed", {
    error,
  });
  process.exit(1);
});
