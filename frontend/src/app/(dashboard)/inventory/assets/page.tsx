"use client";

import { getApiItems } from "@/src/lib/api-data";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listInventory } from "@/src/lib/inventoryClient";

const getItems = getApiItems;

export default function InventoryAssetsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({ queryKey: ["inventory-assets", activeSpaceId], queryFn: () => listInventory({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }) });
  const assets = getItems(data) as Array<{ _id?: string; id?: string; status?: string; quantity?: number; assetTag?: string; serialNumber?: string; productId?: { name?: string; sku?: string } }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Inventory" title="Assets" description="Live physical inventory items from the backend." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load assets.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Assets could not be loaded.</div> : assets.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => <Link key={asset._id || asset.id || asset.assetTag || asset.serialNumber} href={`/inventory/assets/${asset._id || asset.id || ""}`} className="rounded-2xl border border-orange-100 bg-white p-4 transition hover:border-orange-300"><p className="font-medium text-slate-900">{asset.productId?.name || "Inventory item"}</p><p className="text-sm text-slate-600">{asset.assetTag || asset.serialNumber || asset.productId?.sku || "No identifier"}</p><p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{asset.status || "UNKNOWN"}</p></Link>)}</div> : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No assets found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}