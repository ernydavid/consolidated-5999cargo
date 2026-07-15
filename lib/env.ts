import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadEnvironmentFiles();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    DATABASE_MIGRATION_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    AI_PROVIDER: z.string().min(1).optional(),
    AI_API_KEY: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_REDIRECT_URI: z.string().url().optional(),
    DEFAULT_FREIGHT_RATE_USD: z.coerce.number().positive().default(3.8),
    DEFAULT_USD_XCG_RATE: z.coerce.number().positive().default(1.82),
    DEFAULT_ADMIN_COST_XCG: z.coerce.number().nonnegative().default(8.95),
    DEFAULT_TAX_RATE: z.coerce.number().nonnegative().default(0.06),
    SEED_ORGANIZATION_NAME: z.string().min(1).default("5999Cargo"),
    SEED_ADMIN_NAME: z.string().min(1).default("Customs Admin"),
    SEED_ADMIN_EMAIL: z.email().default("admin@5999cargo.local"),
    SEED_ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(
      parsed.error.flatten().fieldErrors,
      null,
      2,
    )}`,
  );
}

export const env = parsed.data;

function loadEnvironmentFiles() {
  const envFiles = [".env.local", ".env"];

  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);

    if (existsSync(path)) {
      loadDotenv({ path, override: false });
    }
  }
}
