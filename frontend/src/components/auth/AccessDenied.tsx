"use client";

import Link from "next/link";
import { routePaths } from "@/src/constants/routes";

export function AccessDenied({ message = "You do not have permission to view this page." }: { message?: string }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8">
      <h1 className="text-2xl font-semibold text-rose-900">Access denied</h1>
      <p className="mt-2 text-sm text-rose-700">{message}</p>
      <div className="mt-6">
        <Link href={routePaths.dashboard.home} className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-brand-strong">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
