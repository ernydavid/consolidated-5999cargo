import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";

export const roles = [
  "super_admin",
  "customs_admin",
  "customs_agent",
  "viewer",
] as const;

export type AppRole = (typeof roles)[number];

const roleRank: Record<AppRole, number> = {
  super_admin: 4,
  customs_admin: 3,
  customs_agent: 2,
  viewer: 1,
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  organizationId: string | null;
  image?: string | null;
};

export function hasRole(userRole: AppRole, minimumRole: AppRole) {
  return roleRank[userRole] >= roleRank[minimumRole];
}

export function requireRole(
  user: SessionUser | null | undefined,
  minimumRole: AppRole,
) {
  if (!user) {
    redirect("/login");
  }

  const normalizedRole = (user.role ?? "viewer") as AppRole;

  if (!hasRole(normalizedRole, minimumRole)) {
    throw new AppError("Forbidden", {
      code: "FORBIDDEN",
      status: 403,
    });
  }

  return {
    ...user,
    role: normalizedRole,
  };
}
