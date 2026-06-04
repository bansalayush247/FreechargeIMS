"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PageHeader } from "@/src/components/layout/page-header";
import { PermissionSelector } from "@/src/features/roles/permission-selector";
import { useRole, useRoleMutations } from "@/src/features/roles/hooks";
import { useAuthorization } from "@/src/hooks/useAuthorization";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";

type RoleDetail = { id?: string; _id?: string; name?: string; code?: string; description?: string; permissions?: string[]; isSystemRole?: boolean; type?: string };

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuthorization();
  const { data, isLoading, isError } = useRole(params.id);
  const { update, remove } = useRoleMutations();
  const role = (data || {}) as RoleDetail;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    const nextRole = data as RoleDetail;
    setName(nextRole.name || "");
    setDescription(nextRole.description || "");
    setPermissions(nextRole.permissions || []);
  }, [data]);

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (isError || !role._id && !role.id) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Role could not be loaded.</div>;

  const isBuiltIn = Boolean(role.isSystemRole || role.type === "system");
  const canUpdate = can(BACKEND_PERMISSIONS.UPDATE_ROLE) && !isBuiltIn;
  const canDelete = can(BACKEND_PERMISSIONS.DELETE_ROLE) && !isBuiltIn;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Roles"
        title={role.name || "Role detail"}
        description="Inspect and maintain this space role's permission set."
        actions={<Button variant="outline" onClick={() => router.push("/roles")}><ArrowLeft className="h-4 w-4" />Back</Button>}
      />
      <div className="space-y-5 rounded-2xl border border-orange-100 bg-white p-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{role.code || "NO_CODE"}</Badge>
          {isBuiltIn ? <Badge>Built in</Badge> : <Badge variant="secondary">Custom</Badge>}
          <Badge variant="secondary">{permissions.length} permissions</Badge>
        </div>
        {isBuiltIn ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Built-in roles are read-only.</div> : null}
        <div className="space-y-2">
          <Label htmlFor="role-name">Name</Label>
          <Input id="role-name" value={name} onChange={(event) => setName(event.target.value)} disabled={!canUpdate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-description">Description</Label>
          <textarea id="role-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={!canUpdate} rows={3} className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <PermissionSelector value={permissions} onChange={setPermissions} disabled={!canUpdate} />
        <div className="flex flex-wrap gap-3">
          {canUpdate ? (
            <Button disabled={!name.trim() || update.isPending} onClick={() => update.mutate({ id: params.id, payload: { name: name.trim(), description: description.trim(), permissions } })}>
              <Save className="h-4 w-4" />{update.isPending ? "Saving..." : "Save changes"}
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="outline" disabled={remove.isPending} onClick={async () => {
              if (!window.confirm(`Delete role "${role.name}"? Members assigned to it will lose those permissions.`)) return;
              await remove.mutateAsync(params.id);
              router.push("/roles");
            }}>
              <Trash2 className="h-4 w-4" />{remove.isPending ? "Deleting..." : "Delete role"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
