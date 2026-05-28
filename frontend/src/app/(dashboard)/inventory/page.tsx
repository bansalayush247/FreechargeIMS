import { FeaturePlaceholder } from "@/src/components/layout/feature-placeholder";
import { PageHeader } from "@/src/components/layout/page-header";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Inventory operations"
        description="Starter surface for stock movements, transfers, and stock reconciliation workflows."
      />
      <FeaturePlaceholder title="Inventory module" description="Inventory workflows will live here with query-driven summaries and mutation flows." />
    </div>
  );
}