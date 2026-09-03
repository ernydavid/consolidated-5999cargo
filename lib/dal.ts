import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/server";
import type { AppRole, SessionUser } from "@/lib/permissions";

export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const requireSession = cache(async () => {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export const getCurrentUser = cache(async () => {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  return enrichUser(user);
});

async function enrichUser(user: User): Promise<SessionUser> {
  const email = user.email?.toLowerCase();
  const profile = email
    ? await db.query.users.findFirst({
        where: eq(users.email, email),
      })
    : null;

  const role = normalizeRole(profile?.role);

  return {
    id: profile?.id ?? user.id,
    email: user.email ?? "",
    name:
      profile?.name ??
      getUserDisplayName(user) ??
      user.email?.split("@")[0] ??
      "User",
    role,
    organizationId: profile?.organizationId ?? null,
    image: profile?.image ?? null,
  };
}

function getUserDisplayName(user: User) {
  const metadata = user.user_metadata;

  return metadata?.name ?? metadata?.full_name ?? null;
}

function normalizeRole(role: string | null | undefined): AppRole {
  if (
    role === "super_admin" ||
    role === "customs_admin" ||
    role === "customs_agent" ||
    role === "viewer"
  ) {
    return role;
  }

  return "viewer";
}
