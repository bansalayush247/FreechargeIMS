"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import CreateInventoryForm from "@/src/features/inventory/components/create-inventory-form";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listInventory } from "@/src/lib/inventoryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";

export default function InventoryPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data: inventoryData } = useQuery({
    queryKey: ["inventory-page", activeSpaceId],
    queryFn: () => listInventory({ spaceId: activeSpaceId || undefined, page: 1, limit: 50 }),
    enabled: Boolean(activeSpaceId),
  });
  const items = inventoryData?.data?.items ?? inventoryData?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Inventory operations"
        description="Starter surface for stock movements, transfers, and stock reconciliation workflows."
      />

      <CreateInventoryForm />
      <Card>
        <CardHeader>
          <CardTitle>Inventory items in selected space</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!activeSpaceId ? (
            <div className="rounded-xl border p-3">Select a space first.</div>
          ) : items.length ? (
            items.map((item: { _id?: string; id?: string; status?: string; quantity?: number; productId?: { name?: string; sku?: string }; warehouseId?: { name?: string; code?: string }; assignedUserId?: { firstName?: string; lastName?: string; employeeId?: string } }) => (
              <div key={item._id || item.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">{item.productId?.name || "Product"} ({item.productId?.sku || "NA"})</div>
                  <Badge variant="secondary">{item.status || "UNKNOWN"}</Badge>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                  <div>Quantity: {item.quantity ?? 0}</div>
                  <div>Warehouse: {item.warehouseId?.name || item.warehouseId?.code || "-"}</div>
                  <div>Assigned To: {[item.assignedUserId?.firstName, item.assignedUserId?.lastName].filter(Boolean).join(" ") || item.assignedUserId?.employeeId || "-"}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border p-3">No inventory items found in this space.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
