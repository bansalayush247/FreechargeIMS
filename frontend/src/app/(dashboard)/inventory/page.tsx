"use client";

import { getApiItems } from "@/src/lib/api-data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PageHeader } from "@/src/components/layout/page-header";
import CreateInventoryForm from "@/src/features/inventory/components/create-inventory-form";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listInventory } from "@/src/lib/inventoryClient";
import { useQuery } from "@tanstack/react-query";

const getItems = getApiItems;

export default function InventoryPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventory-page", activeSpaceId],
    queryFn: () => listInventory({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }),
    enabled: Boolean(activeSpaceId),
  });

  const items = getItems(data);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Inventory operations"
        description="Physical asset tracking for allocation, transfer, returns, and retirement across spaces and warehouses."
      />

      <CreateInventoryForm />

      <Card>
        <CardHeader>
          <CardTitle>Current space inventory</CardTitle>
          <CardDescription>{activeSpaceId ? "Live inventory for the selected space." : "Pick a space in the header to load inventory."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!activeSpaceId ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view inventory.</div>
          ) : isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Inventory could not be loaded right now.</div>
          ) : items.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {(items as Array<{ _id?: string; id?: string; status?: string; quantity?: number; productId?: { name?: string; sku?: string }; warehouseId?: { name?: string; code?: string }; serialNumber?: string; assetTag?: string }>).map((item) => (
                <div key={item._id || item.id || item.assetTag || item.serialNumber} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.productId?.name || "Inventory item"}</p>
                      <p className="text-sm text-slate-600">{item.productId?.sku || item.assetTag || item.serialNumber || "No identifier"}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
                      {item.status || "UNKNOWN"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-600">
                    <p>Quantity: {item.quantity ?? 0}</p>
                    <p>Warehouse: {item.warehouseId?.name || item.warehouseId?.code || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No inventory items found in this space yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
