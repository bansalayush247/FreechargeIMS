"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useRoles } from "@/src/features/roles/hooks";
import { PageHeader } from "@/src/components/layout/page-header";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Authorize } from "@/src/components/auth/Authorize";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";

export default function RolesPage() {
  const { data = [], isLoading, isError } = useRoles();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Roles"
        description="Define permission sets for the active space, then assign them from Members."
        actions={
          <Authorize permission={BACKEND_PERMISSIONS.CREATE_ROLE}>
            <Link href="/roles/create" className={buttonVariants()}><Plus className="h-4 w-4" />Create role</Link>
          </Authorize>
        }
      />
      <Card>
        <CardContent className="space-y-3 p-6">
          {isLoading ? (
            <div className="grid gap-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Roles could not be loaded right now.</div>
          ) : data.length ? data.map((role: { id?: string; _id?: string; name?: string; code?: string; description?: string; permissions?: string[]; isSystemRole?: boolean; type?: string }) => {
            const roleId = role.id || role._id || "";
            return (
              <Link key={roleId || role.name} href={`/roles/${roleId}`} className="flex items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-white p-4 transition hover:border-orange-300 hover:bg-orange-50/30">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{role.name}</p>
                    <Badge variant="secondary">{role.code || "NO_CODE"}</Badge>
                    {role.isSystemRole || role.type === "system" ? <Badge>Built in</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{role.description || "No description provided."}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{role.permissions?.length || 0} permissions</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </Link>
            );
          }) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No roles exist in this space.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
