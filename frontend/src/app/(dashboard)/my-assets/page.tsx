"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { buttonVariants } from "@/src/components/ui/button";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getApiItems } from "@/src/lib/api-data";
import { listMyAssetRegistry } from "@/src/lib/assetRegistryClient";

type Entity = {
  _id?: string;
  id?: string;
  name?: string;
  sku?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
};

type MyAsset = {
  _id?: string;
  id?: string;
  status?: string;
  quantity?: number;
  assignedAt?: string;
  remarks?: string;
  productId?: Entity | string;
  assignedByUserId?: Entity | string;
  requestId?: { requestNumber?: string; status?: string; requestedQuantity?: number } | string | null;
  sourceInventoryItemId?: { _id?: string; id?: string; assetTag?: string; serialNumber?: string; status?: string } | string | null;
};

function readable(value?: string | null) {
  return value ? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
}

function entityLabel(entity?: Entity | string | null) {
  if (!entity) return "";
  if (typeof entity === "string") return entity;

  const personName = [entity.firstName, entity.lastName].filter(Boolean).join(" ");
  return entity.name || entity.sku || personName || entity.employeeId || entity.email || "";
}

function inventoryItemId(asset: MyAsset) {
  const item = asset.sourceInventoryItemId;
  if (!item || typeof item === "string") return "";
  return item._id || item.id || "";
}

function assetIdentifier(asset: MyAsset) {
  const item = asset.sourceInventoryItemId;
  if (item && typeof item === "object") {
    return item.assetTag || item.serialNumber || "";
  }

  return "";
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MyAssetsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-assets", activeSpaceId],
    queryFn: () => listMyAssetRegistry({ spaceId: activeSpaceId ?? undefined, status: "ASSIGNED", page: 1, limit: 100 }),
    enabled: Boolean(activeSpaceId),
  });
  const assets = getApiItems<MyAsset>(data);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="My assets" description="Assets currently assigned to you in the active space." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load your assets.</div>
          ) : isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Assets could not be loaded.</div>
          ) : assets.length ? (
            assets.map((asset) => {
              const itemId = inventoryItemId(asset);
              const request = asset.requestId && typeof asset.requestId === "object" ? asset.requestId : null;

              return (
                <div key={asset._id || asset.id || `${entityLabel(asset.productId)}-${asset.assignedAt || asset.status}`} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{entityLabel(asset.productId) || "Assigned asset"}</p>
                      <p className="text-sm text-slate-600">{assetIdentifier(asset) || "Bulk allocation"} · Qty {asset.quantity || 1}</p>
                    </div>
                    <span className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{asset.status || "UNKNOWN"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {asset.assignedAt ? <span>Assigned: {formatDate(asset.assignedAt)}</span> : null}
                    {entityLabel(asset.assignedByUserId) ? <span>By: {entityLabel(asset.assignedByUserId)}</span> : null}
                    {request?.requestNumber ? <span>Request: {request.requestNumber}</span> : null}
                    {readable(request?.status) ? <span>Request status: {readable(request?.status)}</span> : null}
                  </div>
                  {asset.remarks ? <p className="mt-2 text-sm text-slate-600">{asset.remarks}</p> : null}
                  {itemId ? (
                    <Link href={`/inventory/assets/${itemId}`} className={buttonVariants({ size: "sm", variant: "outline", className: "mt-3" })}>
                      Open asset
                    </Link>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No assets are assigned to you in this space.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
