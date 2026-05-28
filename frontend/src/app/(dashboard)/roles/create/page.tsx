"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PageHeader } from "@/src/components/layout/page-header";
import { useRoleMutations } from "@/src/features/roles/hooks";

export default function CreateRolePage() {
  const router = useRouter();
  const { create } = useRoleMutations();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState("");
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Roles" title="Create role" description="Add a new role with permissions." />
      <Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} />
      <Label>Permissions (comma-separated)</Label><Input value={permissions} onChange={(e) => setPermissions(e.target.value)} />
      <Button onClick={async () => { const role = await create.mutateAsync({ name, permissions: permissions.split(",").map((p) => p.trim()).filter(Boolean) }); router.push(`/roles/${role.id || role._id}`); }}>Create</Button>
    </div>
  );
}
