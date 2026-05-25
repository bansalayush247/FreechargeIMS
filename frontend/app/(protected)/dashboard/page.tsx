"use client";

import { useAuth } from "../../../src/auth/authContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-lg sm:p-8">
      <p className="text-sm uppercase tracking-[0.24em] text-orange-200/70">Protected route</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-orange-50/80">
            Logged in as {user?.email ?? user?.name ?? "an authenticated user"}. Use the navigation to open a space and manage its inventory and requests.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-orange-50 transition hover:bg-white/10"
        >
          Log out
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Spaces", value: "0 synced" },
          { label: "Requests", value: "Pending actions" },
          { label: "Inventory", value: "Read-only view" },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-orange-200/70">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
