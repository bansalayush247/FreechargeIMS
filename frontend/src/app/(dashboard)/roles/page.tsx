"use client";
import Link from "next/link";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { useRoles, useRoleMutations } from "@/src/features/roles/hooks";

export default function RolesPage() {
  const { data = [] } = useRoles();
  const { remove } = useRoleMutations();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Roles" title="Role management" description="Manage RBAC roles and permissions." actions={<Link href="/roles/create"><Button>Create role</Button></Link>} />
      <div className="grid gap-3">
        {(data as Array<{ _id?: string; id?: string; name?: string; permissions?: string[] }>).map((role) => {
          const id = role.id || role._id || "";
          return (
            <div key={id} className="rounded-xl border p-4 flex justify-between items-center">
              <Link href={`/roles/${id}`}>{role.name || "Unnamed role"} ({role.permissions?.length || 0} permissions)</Link>
              <Button variant="outline" onClick={() => remove.mutate(id)}>Delete</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
