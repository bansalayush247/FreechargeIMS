import { FeaturePlaceholder } from "@/src/components/layout/feature-placeholder";
import { PageHeader } from "@/src/components/layout/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Application settings"
        description="Global configuration, feature flags, and user preferences fit naturally in a dedicated settings module."
      />
      <FeaturePlaceholder title="Settings module" description="Use this route for organization-level config and profile preferences." />
    </div>
  );
}