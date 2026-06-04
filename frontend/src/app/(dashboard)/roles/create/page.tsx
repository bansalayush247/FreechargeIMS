"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PageHeader } from "@/src/components/layout/page-header";
import { PermissionSelector } from "@/src/features/roles/permission-selector";
import { toRoleCode } from "@/src/features/roles/permissions";
import { useRoleMutations } from "@/src/features/roles/hooks";
import { useAuthorization } from "@/src/hooks/useAuthorization";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";

export default function CreateRolePage() {
  const router = useRouter();
  const { can } = useAuthorization();
  const { create } = useRoleMutations();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeEdited, setCodeEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  if (!can(BACKEND_PERMISSIONS.CREATE_ROLE)) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">You do not have permission to create roles in this space.</div>;
  }

  const roleCode = code || toRoleCode(name);
  const canSubmit = Boolean(name.trim() && roleCode && !create.isPending);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Roles"
        title="Create role"
        description="Create a reusable permission set for members of the active space."
        actions={<Button variant="outline" onClick={() => router.push("/roles")}><ArrowLeft className="h-4 w-4" />Back</Button>}
      />
      <div className="space-y-5 rounded-2xl border border-orange-100 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={name} onChange={(event) => { setName(event.target.value); if (!codeEdited) setCode(toRoleCode(event.target.value)); }} placeholder="Regional inventory manager" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-code">Code</Label>
            <Input id="role-code" value={roleCode} onChange={(event) => { setCodeEdited(true); setCode(toRoleCode(event.target.value)); }} placeholder="REGIONAL_INVENTORY_MANAGER" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-description">Description</Label>
          <textarea id="role-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="space-y-3">
          <div>
            <Label>Permissions</Label>
            <p className="mt-1 text-sm text-slate-600">{permissions.length} selected</p>
          </div>
          <PermissionSelector value={permissions} onChange={setPermissions} />
        </div>
        <Button disabled={!canSubmit} onClick={async () => {
          const role = await create.mutateAsync({ name: name.trim(), code: roleCode, description: description.trim(), permissions });
          router.push(`/roles/${role.id || role._id}`);
        }}>
          <Save className="h-4 w-4" />{create.isPending ? "Creating..." : "Create role"}
        </Button>
      </div>
    </div>
  );
}
