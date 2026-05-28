import { FeaturePlaceholder } from "@/src/components/layout/feature-placeholder";
import { PageHeader } from "@/src/components/layout/page-header";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Users"
        title="User administration"
        description="Roles, assignments, and access management should be handled through this module."
      />
      <FeaturePlaceholder title="Users module" description="User lists, role editors, and permission panels can be composed here." />
    </div>
  );
}