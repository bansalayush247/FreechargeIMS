"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Layers3,
  ClipboardList,
  ArrowRightLeft,
  RotateCcw,
  History,
  Package,
  Settings,
  Shield,
  Warehouse,
  Users,
  Bell,
  Store,
  UserCheck,
  Workflow,
  UserRoundSearch,
  PackageOpen,
  FileClock,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { Select } from "@/src/components/ui/select";
import { getVisibleNavigationSections } from "@/src/shared/constants/navigation";
import { canAccessPath } from "@/src/lib/authorization";
import { AccessDenied } from "@/src/components/auth/AccessDenied";

const iconByLabel = {
  Dashboard: LayoutDashboard,
  "Create Request": ClipboardList,
  "My Requests": ClipboardList,
  "Employee Requests": UserCheck,
  "Merchant Requests": Store,
  "Pending Approvals": UserRoundSearch,
  "Fulfillment Queue": PackageOpen,
  Assets: Boxes,
  Transfers: ArrowRightLeft,
  Returns: RotateCcw,
  History: History,
  Products: Package,
  Merchants: Store,
  Warehouses: Warehouse,
  Members: Users,
  Roles: Shield,
  Spaces: Layers3,
  "Join Requests": UserRoundSearch,
  Workflows: Workflow,
  "Audit Logs": FileClock,
  Notifications: Bell,
  "My Assets": Boxes,
  Settings: Settings,
} as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, refreshCurrentUser } = useAuth();
  const { activeSpaceId, mySpaces, setActiveSpaceId } = useCurrentSpace();
  const joinedSpaceSignature = useMemo(
    () => mySpaces.map((space) => space.id || space._id || "").filter(Boolean).sort().join("|"),
    [mySpaces],
  );
  const previousJoinedSpaceSignature = useRef(joinedSpaceSignature);
  const visibleSections = getVisibleNavigationSections(user, activeSpaceId).map((section) => ({
    ...section,
    items: section.items.filter((item) => item.href),
  }));
  const userLabel = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;
  const hasRouteAccess = canAccessPath(user, pathname, activeSpaceId);

  useEffect(() => {
    if (!hasRouteAccess && pathname !== "/dashboard") {
      router.replace("/dashboard");
    }
  }, [hasRouteAccess, pathname, router]);

  useEffect(() => {
    if (joinedSpaceSignature === previousJoinedSpaceSignature.current) {
      return;
    }

    previousJoinedSpaceSignature.current = joinedSpaceSignature;
    refreshCurrentUser().catch(() => {});
  }, [joinedSpaceSignature, refreshCurrentUser]);

  useEffect(() => {
    if (!activeSpaceId) {
      return;
    }

    refreshCurrentUser().catch(() => {});
  }, [activeSpaceId, refreshCurrentUser]);

  useEffect(() => {
    const refreshAuthorization = () => {
      if (document.visibilityState === "visible") {
        refreshCurrentUser().catch(() => {});
      }
    };
    const intervalId = window.setInterval(refreshAuthorization, 30_000);

    window.addEventListener("focus", refreshAuthorization);
    document.addEventListener("visibilitychange", refreshAuthorization);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshAuthorization);
      document.removeEventListener("visibilitychange", refreshAuthorization);
    };
  }, [refreshCurrentUser]);

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">FreechargeIMS</p>
            <p className="text-sm text-slate-600">Asset and inventory operations workspace</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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

      <div className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-[108px] lg:h-[calc(100vh-132px)]">
          <nav className="space-y-4 rounded-[1.75rem] border border-orange-100 bg-white p-4 shadow-[0_20px_50px_rgba(255,107,53,0.08)] lg:h-full lg:overflow-y-auto">
            <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,255,255,0.96))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Space aware access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Users only see spaces they belong to. Active space controls request, inventory, and workflow data.
              </p>
            </div>

            <div className="space-y-5">
              {visibleSections.map((section) => (
                <div key={section.label} className="space-y-2">
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{section.label}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      const Icon = iconByLabel[item.label as keyof typeof iconByLabel] || LayoutDashboard;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition",
                            active ? "bg-brand text-slate-950 shadow-sm shadow-brand/20" : "text-slate-700 hover:bg-orange-50 hover:text-slate-900",
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
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="space-y-6">{hasRouteAccess ? children : <AccessDenied />}</div>
        </main>
      </div>
    </div>
  );
}
