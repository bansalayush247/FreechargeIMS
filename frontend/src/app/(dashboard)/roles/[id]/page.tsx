"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PageHeader } from "@/src/components/layout/page-header";
import { useRole, useRoleMutations } from "@/src/features/roles/hooks";

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const { data } = useRole(params.id);
  const { update } = useRoleMutations();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState("");
  const role = (data || {}) as { id?: string; _id?: string; name?: string; permissions?: string[] };
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Roles" title={role.name || "Role detail"} description="Inspect and update role permissions." />
      <div className="text-sm">Permissions: {(role.permissions || []).join(", ") || "None"}</div>
      <Label>New name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={role.name || ""} />
      <Label>Replace permissions</Label><Input value={permissions} onChange={(e) => setPermissions(e.target.value)} placeholder={(role.permissions || []).join(",")} />
      <Button onClick={() => update.mutate({ id: params.id, payload: { name: name || role.name || "", permissions: permissions ? permissions.split(",").map((p) => p.trim()).filter(Boolean) : role.permissions || [] } })}>Update role</Button>
    </div>
  );
}
