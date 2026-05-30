"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Layers3,
  Package,
  Settings,
  Shield,
  Warehouse,
  Users,
  Bell,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { routePaths } from "@/src/constants/routes";
import { useAuth } from "@/src/features/auth/auth-provider";
import { hasPermission } from "@/src/lib/permissions";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { Select } from "@/src/components/ui/select";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: { action: string; resource?: string };
};

const navItems: NavItem[] = [
  { href: routePaths.dashboard.home, label: "Dashboard", icon: LayoutDashboard },
  { href: routePaths.dashboard.products, label: "Products", icon: Package, permission: { action: "VIEW", resource: "PRODUCTS" } },
  { href: routePaths.dashboard.spaces, label: "Spaces", icon: Layers3 },
  { href: routePaths.dashboard.storageLocations, label: "Storage locations", icon: Warehouse, permission: { action: "VIEW", resource: "WAREHOUSES" } },
  { href: routePaths.dashboard.inventory, label: "Inventory", icon: Boxes },
  { href: routePaths.dashboard.notifications, label: "Notifications", icon: Bell },
  { href: routePaths.dashboard.admin, label: "Admin", icon: Shield, permission: { action: "MANAGE", resource: "ROLES" } },
  { href: "/roles", label: "Roles", icon: Shield, permission: { action: "MANAGE", resource: "ROLES" } },
  { href: "/members", label: "Members", icon: Users, permission: { action: "VIEW", resource: "MEMBERS" } },
  { href: "/repairs", label: "Repairs", icon: Package, permission: { action: "VIEW", resource: "REPAIRS" } },
  { href: "/workflows", label: "Workflows", icon: Layers3, permission: { action: "VIEW", resource: "WORKFLOWS" } },
  { href: "/audit-logs", label: "Audit Logs", icon: Shield, permission: { action: "VIEW", resource: "AUDIT_LOGS" } },
  { href: "/logs", label: "Logs", icon: Shield, permission: { action: "MANAGE", resource: "LOGS" } },
  { href: routePaths.dashboard.users, label: "Users", icon: Users },
  { href: routePaths.dashboard.settings, label: "Settings", icon: Settings },
];

function isAdminRole(role?: string) {
  return Boolean(role && ["admin", "ADMIN", "superadmin", "SUPERADMIN", "owner", "OWNER"].includes(role));
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeSpaceId, mySpaces, setActiveSpaceId } = useCurrentSpace();
  const visibleNavItems = navItems.filter((item) =>
    item.permission ? hasPermission(user, item.permission) || isAdminRole(user?.role as string | undefined) : true,
  );
  const userLabel = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">FreechargeIMS</p>
            <p className="text-sm text-slate-600">Enterprise inventory management shell</p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={activeSpaceId || ""} onChange={(event) => setActiveSpaceId(event.target.value || null)}>
              <option value="">Select space</option>
              {mySpaces.map((space) => {
                const spaceId = space.id || space._id;
                if (!spaceId) return null;
                return (
                  <option key={spaceId} value={spaceId}>
                    {space.name}
                  </option>
                );
              })}
            </Select>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{userLabel}</p>
              <p className="text-xs text-slate-500">{user?.role || "member"}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-orange-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-[88px] lg:h-[calc(100vh-112px)]">
          <nav className="rounded-[1.75rem] border border-orange-100 bg-white p-3 shadow-[0_20px_50px_rgba(255,107,53,0.08)] lg:h-full">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Navigation</p>
            <div className="space-y-1">
              {visibleNavItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition",
                        active ? "bg-brand text-slate-950" : "text-slate-700 hover:bg-orange-50 hover:text-slate-900",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {active ? <span className="text-xs uppercase tracking-[0.18em]">Active</span> : null}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
