"use client";

import { useRoles } from "@/src/features/roles/hooks";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function RolesPage() {
  const { data = [], isLoading, isError } = useRoles();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Roles" description="Role definitions control which workflows, approvals, and operational tools each user can access." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {isLoading ? (
            <div className="grid gap-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Roles could not be loaded right now.</div>
          ) : data.length ? data.map((role: { id?: string; _id?: string; name?: string; description?: string; permissions?: string[] }) => (
            <div key={role.id || role._id || role.name} className="rounded-2xl border border-orange-100 bg-white p-4">
              <p className="font-medium text-slate-900">{role.name}</p>
              <p className="mt-1 text-sm text-slate-600">{role.description || "No description provided."}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{role.permissions?.length || 0} permissions</p>
            </div>
          )) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No roles returned by the backend.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}