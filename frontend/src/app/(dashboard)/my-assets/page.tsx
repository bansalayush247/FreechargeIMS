"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listMyAssetRegistry } from "@/src/lib/assetRegistryClient";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function MyAssetsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({ queryKey: ["my-assets", activeSpaceId], queryFn: () => listMyAssetRegistry({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 100 }), enabled: Boolean(activeSpaceId) });
  const assets = getItems(data) as Array<{ _id?: string; id?: string; status?: string; quantity?: number; productId?: { name?: string; sku?: string }; sourceInventoryItemId?: { assetTag?: string; serialNumber?: string } | string }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="My assets" description="Assets currently assigned to the signed-in user." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load your assets.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Assets could not be loaded.</div> : assets.length ? assets.map((asset) => (
            <div key={asset._id || asset.id || `${asset.productId?.sku || "asset"}-${asset.status || "assigned"}`} className="rounded-2xl border border-orange-100 bg-white p-4">
              <p className="font-medium text-slate-900">{asset.productId?.name || "Assigned asset"}</p>
              <p className="text-sm text-slate-600">{typeof asset.sourceInventoryItemId === "object" ? asset.sourceInventoryItemId.assetTag || asset.sourceInventoryItemId.serialNumber : asset.productId?.sku || "No identifier"}</p>
              <p className="text-sm text-slate-600">Quantity: {asset.quantity || 1}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{asset.status || "UNKNOWN"}</p>
            </div>
          )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No assets are assigned to you in this space.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
