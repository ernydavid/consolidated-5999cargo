import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/server";
import type { AppRole, SessionUser } from "@/lib/permissions";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
});

export const requireSession = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return enrichUser(session.user);
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
