import { FeaturePlaceholder } from "@/src/components/layout/feature-placeholder";
import { PageHeader } from "@/src/components/layout/page-header";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Administrative controls"
        description="Join requests, audit visibility, and workspace-level governance can be layered into this area."
      />
      <FeaturePlaceholder title="Admin module" description="Admin-only tools are isolated here for role-based access control." />
    </div>
  );
}