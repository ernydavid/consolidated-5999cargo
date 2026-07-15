"use client";

import { ChevronDown, LogOut, MoonStar, Settings2, User2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/client";
import type { SessionUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function UserMenu({
  user,
  variant = "sidebar",
}: Readonly<{
  user: SessionUser;
  variant?: "sidebar" | "compact-sidebar" | "icon";
}>) {
  const router = useRouter();
  const supabase = createClient();
  const initials = user.name.slice(0, 1).toUpperCase();
  const isIcon = variant === "icon";
  const isCompactSidebar = variant === "compact-sidebar";
  const isSidebar = variant === "sidebar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={cn(
              "transition outline-none",
              isIcon
                ? "inline-flex size-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 shadow-sm hover:bg-white"
                : isCompactSidebar
                  ? "flex size-10 items-center justify-center rounded-full bg-transparent hover:bg-slate-100/80"
                  : "flex size-8 items-center justify-center rounded-full bg-transparent text-slate-500 hover:bg-slate-100/80 hover:text-slate-800",
            )}
            type="button"
          >
            {isSidebar ? (
              <ChevronDown className="size-4" />
            ) : (
              <Avatar
                size={isIcon || isCompactSidebar ? "lg" : "default"}
                className={cn(
                  "bg-cyan-100 text-cyan-700 after:border-cyan-200/50",
                  isIcon || isCompactSidebar ? "size-10" : "size-10",
                )}
              >
                {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                <AvatarFallback className="bg-cyan-100 font-semibold text-cyan-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
          </button>
        }
      />
      <DropdownMenuContent
        align={isIcon ? "end" : "start"}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-[1.65rem] border border-slate-200/80 bg-white/96 p-2 shadow-2xl backdrop-blur"
        sideOffset={10}
      >
        <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="bg-cyan-100 text-cyan-700 after:border-cyan-200/50">
              {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
              <AvatarFallback className="bg-cyan-100 font-semibold text-cyan-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
            {user.role.replaceAll("_", " ")}
          </p>
        </div>

        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Preferences
        </p>
        <DropdownMenuItem className="rounded-[1.1rem] px-3 py-3 text-slate-700">
          <Settings2 className="size-4 text-slate-500" />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-[1.1rem] px-3 py-3 text-slate-700">
          <MoonStar className="size-4 text-slate-500" />
          Theme preference
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-[1.1rem] px-3 py-3 text-slate-700">
          <User2 className="size-4 text-slate-500" />
          Personal profile
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-slate-200/80" />
        <DropdownMenuItem
          className="rounded-[1.1rem] px-3 py-3 text-slate-700"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarUserSummary({
  user,
}: Readonly<{
  user: SessionUser;
}>) {
  const initials = user.name.slice(0, 1).toUpperCase();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
      <Avatar size="lg" className="bg-cyan-100 text-cyan-700 after:border-cyan-200/50">
        {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
        <AvatarFallback className="bg-cyan-100 font-semibold text-cyan-700">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
    </div>
  );
}
