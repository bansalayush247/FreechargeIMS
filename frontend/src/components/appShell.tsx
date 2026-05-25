"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "../auth/authContext";

type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/spaces", label: "Spaces" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

function isAdminRole(role?: string) {
  if (!role) {
    return false;
  }

  return ["admin", "ADMIN", "superadmin", "SUPERADMIN", "owner", "OWNER"].includes(role);
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || isAdminRole(user?.role as string | undefined)),
    [user?.role],
  );

  const userLabel = user?.name || user?.email || "Freecharge user";

  return (
    <div className="min-h-screen text-orange-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6b35] text-sm font-semibold text-white shadow-lg shadow-orange-500/20">
              F
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-orange-100/80 uppercase">FreechargeIMS</p>
              <p className="text-xs text-orange-50/60">Space, inventory, and request control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-orange-50">{userLabel}</span>
              <span className="text-xs text-orange-50/60">{user?.role || "member"}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-orange-50 transition hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-[88px] lg:h-[calc(100vh-112px)]">
          <nav className="rounded-[1.75rem] border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/20 backdrop-blur-lg lg:h-full">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.22em] text-orange-200/70">Navigation</p>
            <div className="space-y-1">
              {visibleNavItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#ff6b35] text-white shadow-lg shadow-orange-500/20"
                        : "text-orange-50/80 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    {active ? <span className="text-xs uppercase tracking-[0.18em] text-white/80">Active</span> : null}
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-200/70">Current Space</p>
              <div className="mt-3 space-y-2">
                <div className="rounded-2xl border border-dashed border-white/10 px-3 py-3 text-sm text-orange-50/65">
                  Select a space once the spaces catalog is connected.
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-orange-50/80 transition hover:bg-white/10"
                >
                  Space selector
                </button>
              </div>
            </div>
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>

      <footer className="border-t border-white/10 bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 text-xs text-orange-50/55 sm:px-6 lg:px-8">
          <span>FreechargeIMS frontend</span>
          <span>Responsive protected shell</span>
        </div>
      </footer>
    </div>
  );
}
