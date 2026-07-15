"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Package2,
  Search,
  Settings,
  Slash,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarUserSummary, UserMenu } from "@/components/dashboard/user-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/permissions";

type NavigationGroup = {
  label: string;
  items: ReadonlyArray<{
    href: string;
    label: string;
    icon: LucideIcon;
  }>;
};

const navigationGroups: ReadonlyArray<NavigationGroup> = [
  {
    label: "Workspace",
    items: [
      {
        href: "/",
        label: "Overview",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Customs",
    items: [
      {
        href: "/customs/consolidados",
        label: "Consolidados",
        icon: Package2,
      },
      {
        href: "/customs/settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

const compactNotifications = [
  {
    id: "foundation",
    title: "Foundation ready",
    summary: "Auth, settings and shell are stable.",
    timestamp: "Now",
    unread: true,
  },
  {
    id: "import",
    title: "Import phase pending",
    summary: "Consolidado upload flow is the next delivery block.",
    timestamp: "Today",
    unread: false,
  },
] as const;

export function AppShell({
  children,
  user,
}: Readonly<{
  children: React.ReactNode;
  user: SessionUser;
}>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const query = navQuery.trim().toLowerCase();

    if (!query) {
      return navigationGroups;
    }

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navQuery]);

  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (!segments.length) {
      return [{ href: "/", label: "Overview", current: true }];
    }

    const labels: Record<string, string> = {
      customs: "Customs",
      consolidados: "Consolidados",
      settings: "Settings",
      new: "New consolidado",
    };

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const label =
        labels[segment] ??
        segment
          .replaceAll("-", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

      return {
        href,
        label,
        current: index === segments.length - 1,
      };
    });
  }, [pathname]);

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#f6f9fb_0%,#eef3f7_100%)] text-slate-950">
      <div className="flex min-h-svh">
        <div className="relative hidden lg:flex">
          <aside
            className={cn(
              "group/sidebar fixed inset-y-0 left-0 z-40 flex flex-col overflow-visible bg-white/92 backdrop-blur transition-[width] duration-200",
              collapsed ? "w-12" : "w-64",
            )}
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 z-40 w-px bg-slate-200/80 transition-colors group-hover/sidebar:bg-slate-500/70" />
            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="absolute right-0 top-1/2 z-50 flex size-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300/90 bg-white shadow-sm opacity-0 transition-all duration-150 group-hover/sidebar:opacity-100 hover:border-slate-400"
              onClick={() => setCollapsed((current) => !current)}
              type="button"
            >
              {collapsed ? (
                <ChevronRight className="size-4 text-slate-700 transition-colors" />
              ) : (
                <ChevronLeft className="size-4 text-slate-700 transition-colors" />
              )}
            </button>
            <div className="absolute inset-y-0 -right-2 z-40 w-4 cursor-ew-resize" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SidebarContent
                collapsed={collapsed}
                groups={filteredGroups}
                navQuery={navQuery}
                onNavQueryChange={setNavQuery}
                user={user}
              />
            </div>
          </aside>

          <div
            className={cn(
              "shrink-0",
              collapsed ? "w-12" : "w-64",
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-transparent">
            <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Open navigation"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 shadow-sm transition hover:bg-white lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  type="button"
                >
                  <Menu className="size-4 text-slate-600" />
                </button>
                <button
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="hidden size-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 shadow-sm transition hover:bg-white lg:inline-flex"
                  onClick={() => setCollapsed((current) => !current)}
                  type="button"
                >
                  <Menu className="size-4 text-slate-600" />
                </button>
              </div>

              <nav className="justify-self-center overflow-hidden">
                <ol className="flex flex-wrap items-center justify-center gap-2 text-sm">
                  {breadcrumbItems.map((item, index) => (
                    <li key={item.href} className="flex items-center gap-2">
                      {index > 0 ? (
                        <Slash className="size-3 text-slate-300" />
                      ) : null}
                      {item.current ? (
                        <span className="truncate font-semibold text-slate-950">
                          {item.label}
                        </span>
                      ) : (
                        <Link
                          href={item.href}
                          className="truncate text-slate-500 transition hover:text-slate-800"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="flex items-center gap-2 justify-self-end">
                <NotificationMenu />
                <UserMenu user={user} variant="icon" />
              </div>
            </div>
          </header>

          <main className="p-4 pt-3 sm:p-6 sm:pt-3">
            <div className="space-y-6 pb-6">{children}</div>
          </main>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[18rem] max-w-[18rem] border-r border-slate-200/80 bg-white/95 p-0 shadow-2xl backdrop-blur"
        >
          <SidebarContent
            collapsed={false}
            groups={filteredGroups}
            navQuery={navQuery}
            onNavQueryChange={setNavQuery}
            user={user}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SidebarContent({
  collapsed,
  groups,
  navQuery,
  onNavQueryChange,
  user,
  onNavigate,
}: Readonly<{
  collapsed: boolean;
  groups: typeof navigationGroups;
  navQuery: string;
  onNavQueryChange: (value: string) => void;
  user: SessionUser;
  onNavigate?: () => void;
}>) {
  return (
    <>
      <div className="px-2 pb-2 pt-2">
        <div
          className={cn(
            "flex h-14 items-center rounded-[1.25rem] px-3",
            collapsed ? "justify-center px-0" : "gap-3",
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Building2 className="size-4" />
          </div>
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">
                  5999Cargo Customs
                </p>
                <p className="truncate text-xs text-slate-500">/5999cargo</p>
              </div>
              <button
                className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100"
                type="button"
              >
                <ChevronsUpDown className="size-3.5" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {!collapsed ? (
        <div className="px-2 pb-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-10 text-sm outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              onChange={(event) => onNavQueryChange(event.target.value)}
              placeholder="Find a module"
              value={navQuery}
            />
            <button
              className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => onNavQueryChange("")}
              type="button"
            >
              {navQuery ? (
                <X className="size-3.5" />
              ) : (
                <span className="rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  F
                </span>
              )}
            </button>
          </label>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-px px-2 py-2">
          {groups.map((group, index) => (
            <section
              key={group.label}
              className="space-y-px"
            >
              {index > 0 && !collapsed ? (
                <div className="mx-2 my-px h-px bg-slate-200/70" />
              ) : null}
              <nav className="space-y-px">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    collapsed={collapsed}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    onNavigate={onNavigate}
                  />
                ))}
              </nav>
            </section>
          ))}
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        {collapsed ? (
          <UserMenu user={user} variant="compact-sidebar" />
        ) : (
          <div className="flex items-center">
            <SidebarUserSummary user={user} />
            <UserMenu user={user} variant="sidebar" />
          </div>
        )}
      </div>
    </>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: Readonly<{
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}>) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const content = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex h-9 items-center rounded-xl border text-sm font-medium transition",
        collapsed ? "size-8 justify-center px-0 py-0" : "gap-3 px-3 py-2",
        isActive
          ? "border-transparent bg-slate-100 text-slate-950 shadow-sm"
          : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );

  if (!collapsed) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function NotificationMenu() {
  const unreadCount = compactNotifications.filter((item) => item.unread).length;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <button
                  className="relative inline-flex size-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 shadow-sm transition hover:bg-white"
                  type="button"
                >
                  <Bell className="size-4 text-slate-600" />
                  {unreadCount ? (
                    <span className="absolute right-2.5 top-2.5 min-w-4 rounded-full bg-cyan-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
              }
            />
          }
        />
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] rounded-[1.7rem] border border-slate-200/80 bg-white/96 p-2 shadow-2xl backdrop-blur"
        sideOffset={10}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Notifications</p>
            <p className="text-xs text-slate-500">
              {unreadCount} unread right now
            </p>
          </div>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
            Live
          </span>
        </div>
        <DropdownMenuSeparator className="my-1 bg-slate-200/80" />
        <div className="max-h-[26rem] space-y-1 overflow-y-auto px-1 py-1">
          {compactNotifications.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="items-start rounded-[1.2rem] px-3 py-3"
            >
              <div className="mt-1 size-2.5 shrink-0 rounded-full bg-cyan-600/80" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {item.title}
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">
                    {item.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {item.summary}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="my-1 bg-slate-200/80" />
        <p className="px-3 py-2 text-xs text-slate-500">Bulk actions</p>
        <div className="grid grid-cols-2 gap-2 px-2 pb-2">
          <button
            className="rounded-[1.1rem] border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            type="button"
          >
            Mark all read
          </button>
          <button
            className="rounded-[1.1rem] border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
            type="button"
          >
            Open inbox
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
