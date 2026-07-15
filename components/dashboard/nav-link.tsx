"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Package2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const icons = {
  dashboard: LayoutDashboard,
  package: Package2,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export function NavLink({
  href,
  iconName,
  label,
}: Readonly<{
  href: string;
  iconName: keyof typeof icons;
  label: string;
}>) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icons[iconName];

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition",
        isActive
          ? "border-cyan-200 bg-cyan-50 text-slate-950 shadow-sm"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl transition",
          isActive
            ? "bg-cyan-100 text-cyan-700"
            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span>{label}</span>
    </Link>
  );
}
