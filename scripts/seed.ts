import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { createDb } from "../db";
import { appSettings, organizations, users } from "../db/schema";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { createSupabaseAdminClient } from "../lib/supabase-admin";

type SeedDb = ReturnType<typeof createDb>["db"];

async function main() {
  const connectionString = env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL;
  const { db, close } = createDb(connectionString);

  try {
    const organizationId = `org_${randomUUID()}`;

    const existingOrganization = await db.query.organizations.findFirst();

    const orgId = existingOrganization?.id ?? organizationId;

    if (!existingOrganization) {
      await db.insert(organizations).values({
        id: orgId,
        name: env.SEED_ORGANIZATION_NAME,
        timezone: "America/Curacao",
      });
    }

    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, env.SEED_ADMIN_EMAIL.toLowerCase()),
    });

    if (!existingAdmin) {
      const adminId = `usr_${randomUUID()}`;

      await db.insert(users).values({
        id: adminId,
        name: env.SEED_ADMIN_NAME,
        email: env.SEED_ADMIN_EMAIL.toLowerCase(),
        emailVerified: true,
        organizationId: orgId,
        role: "super_admin",
      });

      logger.info("Seeded internal app user", {
        adminEmail: env.SEED_ADMIN_EMAIL,
      });
    }

    const currentAdmin = await db.query.users.findFirst({
      where: eq(users.email, env.SEED_ADMIN_EMAIL.toLowerCase()),
    });

    if (
      currentAdmin &&
      (!currentAdmin.organizationId || currentAdmin.role !== "super_admin")
    ) {
      await db
        .update(users)
        .set({
          organizationId: orgId,
          role: "super_admin",
        })
        .where(eq(users.id, currentAdmin.id));
    }

    const settings = await db.query.appSettings.findFirst({
      where: eq(appSettings.organizationId, orgId),
    });

    if (!settings) {
      await db.insert(appSettings).values({
        id: `settings_${randomUUID()}`,
        organizationId: orgId,
        freightRateUsdPerLb: String(env.DEFAULT_FREIGHT_RATE_USD),
        usdToXcgRate: String(env.DEFAULT_USD_XCG_RATE),
        adminCostXcg: String(env.DEFAULT_ADMIN_COST_XCG),
        taxRate: String(env.DEFAULT_TAX_RATE),
        effectiveFrom: new Date(),
        createdBy: currentAdmin?.id,
      });
    }

    await syncSupabaseAuthUser(db);

    logger.info("Seed completed", {
      organizationId: orgId,
      adminEmail: env.SEED_ADMIN_EMAIL,
    });
  } finally {
    await close();
  }
}

async function syncSupabaseAuthUser(db: SeedDb) {
  const supabaseAdmin = createSupabaseAdminClient();
  const adminEmail = env.SEED_ADMIN_EMAIL.toLowerCase();

  if (!supabaseAdmin) {
    logger.warn("Skipped Supabase auth seed", {
      adminEmail,
      note: "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to create auth users automatically.",
    });
    return;
  }

  const { data: listData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (listError) {
    throw listError;
  }

  const existingAuthUser = listData.users.find(
    (user) => user.email?.toLowerCase() === adminEmail,
  );

  if (existingAuthUser) {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password: env.SEED_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: env.SEED_ADMIN_NAME,
        },
      },
    );

    if (updateError) {
      throw updateError;
    }

    logger.info("Updated Supabase auth user", {
      adminEmail,
      authUserId: existingAuthUser.id,
    });
    return;
  }

  const { data: createdUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: env.SEED_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: env.SEED_ADMIN_NAME,
      },
    });

  if (createError) {
    throw createError;
  }

  logger.info("Created Supabase auth user", {
    adminEmail,
    authUserId: createdUser.user?.id,
  });
}

main().catch((error) => {
  logger.error("Seed failed", { error });
  process.exit(1);
});
