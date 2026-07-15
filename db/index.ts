import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "@/db/schema";

function buildDb(connectionString: string) {
  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
  });

  return {
    db: drizzle(client, { schema }),
    close: async () => {
      await client.end();
    },
  };
}

export function createDb(connectionString: string) {
  return buildDb(connectionString);
}

const globalForDb = globalThis as typeof globalThis & {
  __appDatabase?: ReturnType<typeof buildDb>;
};

const appDatabase =
  globalForDb.__appDatabase ?? buildDb(env.DATABASE_URL);

if (env.NODE_ENV !== "production") {
  globalForDb.__appDatabase = appDatabase;
}

export const db = appDatabase.db;
export const closeDbConnection = appDatabase.close;
