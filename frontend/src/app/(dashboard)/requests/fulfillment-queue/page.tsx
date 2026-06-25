"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Boxes, Check, PackageCheck } from "lucide-react";
import { PageHeader } from "@/src/components/layout/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getApiItems } from "@/src/lib/api-data";
import { fulfillAssetRequest, listFulfillmentQueue } from "@/src/lib/assetRequestClient";
import { listInventory } from "@/src/lib/inventoryClient";
import { getApiErrorMessage } from "@/src/services/http/client";

type Product = { _id?: string; id?: string; name?: string; sku?: string; trackingType?: string };
type Request = {
  _id?: string;
  id?: string;
  requestNumber?: string;
  status?: string;
  productId?: Product | string;
  requestedQuantity?: number;
  businessJustification?: string;
  employeeId?: { firstName?: string; lastName?: string };
  merchantId?: { name?: string; merchantCode?: string };
};
type Asset = { _id?: string; id?: string; assetTag?: string; serialNumber?: string; status?: string; condition?: string; warehouseId?: { name?: string; code?: string } };

function requestId(request: Request) {
  return request._id || request.id || "";
}

function productId(request: Request) {
  return typeof request.productId === "string" ? request.productId : request.productId?._id || request.productId?.id || "";
}

function SerializedAssetPicker({ request, spaceId, isPending, onFulfill }: { request: Request; spaceId: string; isPending: boolean; onFulfill: (assetIds: string[]) => void }) {
  const required = request.requestedQuantity ?? 1;
  const [selected, setSelected] = useState<string[]>([]);
  const assetsQuery = useQuery({
    queryKey: ["fulfillment-assets", spaceId, productId(request)],
    queryFn: () => listInventory({ spaceId, productId: productId(request), page: 1, limit: 100 }),
    enabled: Boolean(spaceId && productId(request)),
  });
  const available = getApiItems<Asset>(assetsQuery.data).filter((asset) => asset.status === "AVAILABLE");

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < required ? [...current, id] : current);
  };

  return (
    <div className="mt-4 border-t border-orange-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm font-medium text-slate-900">Select exact assets</p><p className="text-xs text-slate-500">Choose {required} serialized {required === 1 ? "asset" : "assets"} to assign.</p></div>
        <Badge variant={selected.length === required ? "default" : "secondary"}>{selected.length} / {required} selected</Badge>
      </div>
      {assetsQuery.isLoading ? <Skeleton className="mt-3 h-24 w-full" /> : assetsQuery.isError ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">Available assets could not be loaded.</p> : available.length ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {available.map((asset) => {
            const id = asset._id || asset.id || "";
            const checked = selected.includes(id);
            return (
              <button key={id} type="button" onClick={() => toggle(id)} disabled={!id || isPending} className={`flex min-h-20 items-start gap-3 rounded-2xl border p-3 text-left transition ${checked ? "border-orange-400 bg-orange-50" : "border-orange-100 bg-white hover:border-orange-300"}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 bg-white"}`}>{checked ? <Check className="h-3.5 w-3.5" /> : null}</span>
                <span><span className="block font-medium text-slate-900">{asset.assetTag || asset.serialNumber || "Inventory asset"}</span><span className="block text-xs text-slate-500">{asset.serialNumber || "No serial number"} · {asset.warehouseId?.name || asset.warehouseId?.code || "No warehouse"}</span></span>
              </button>
            );
          })}
        </div>
      ) : <p className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-3 text-sm text-slate-600">No available serialized assets found for this product.</p>}
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => onFulfill(selected)} disabled={isPending || selected.length !== required}>
          <PackageCheck className="h-4 w-4" />{isPending ? "Assigning..." : `Assign ${required} ${required === 1 ? "asset" : "assets"}`}
        </Button>
      </div>
    </div>
  );
}

export default function FulfillmentQueuePage() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const [message, setMessage] = useState<string | null>(null);
  const queueQuery = useQuery({
    queryKey: ["asset-requests", "fulfillment-queue", activeSpaceId],
    queryFn: () => listFulfillmentQueue({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }),
    enabled: Boolean(activeSpaceId),
  });
  const requests = getApiItems<Request>(queueQuery.data).filter((request) => ["PENDING_FULFILLMENT", "FULFILLMENT_PENDING", "FULFILLMENT_DELAYED"].includes(request.status || ""));
  const fulfillment = useMutation({
    mutationFn: ({ id, inventoryAssetIds }: { id: string; inventoryAssetIds?: string[] }) => fulfillAssetRequest(id, { inventoryAssetIds }, activeSpaceId ?? undefined),
    onSuccess: async () => {
      setMessage("Request fulfilled successfully.");
      await queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["fulfillment-assets"] });
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
  });
  const pendingRequestId = fulfillment.isPending ? fulfillment.variables?.id : "";

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Requests" title="Fulfillment queue" description="Allocate exact serialized assets or fulfill quantity-based bulk requests." />
      {message ? <p className="rounded-2xl border border-orange-100 bg-white p-3 text-sm text-slate-600">{message}</p> : null}
      <Card>
        <CardContent className="space-y-4 p-6">
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view fulfillment work.</div> : queueQuery.isLoading ? <Skeleton className="h-32 w-full" /> : queueQuery.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Fulfillment queue could not be loaded.</div> : requests.length ? requests.map((request) => {
            const id = requestId(request);
            const product = typeof request.productId === "object" ? request.productId : undefined;
            const serialized = product?.trackingType === "SERIALIZED";
            const assignee = request.merchantId?.name || [request.employeeId?.firstName, request.employeeId?.lastName].filter(Boolean).join(" ") || "Requester";
            return (
              <div key={id} className="rounded-2xl border border-orange-100 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-semibold text-slate-900">{product?.name || "Request"}</p><p className="text-sm text-slate-600">{request.requestNumber || id} · {product?.sku || "No SKU"} · Qty {request.requestedQuantity ?? 0}</p><p className="mt-1 text-xs text-slate-500">Assign to {assignee}</p></div>
                  <div className="flex items-center gap-2"><Badge variant="secondary">{serialized ? "Serialized" : "Bulk"}</Badge><Link href={`/requests/${id}`} className={buttonVariants({ size: "icon", variant: "outline" })} title="Open request"><ArrowRight className="h-4 w-4" /></Link></div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{request.businessJustification || "No justification provided."}</p>
                {serialized ? <SerializedAssetPicker request={request} spaceId={activeSpaceId} isPending={pendingRequestId === id} onFulfill={(inventoryAssetIds) => fulfillment.mutate({ id, inventoryAssetIds })} /> : (
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-orange-100 pt-4"><p className="flex items-center gap-2 text-sm text-slate-600"><Boxes className="h-4 w-4 text-orange-500" />Bulk stock will be allocated by quantity.</p><Button size="sm" onClick={() => fulfillment.mutate({ id })} disabled={pendingRequestId === id || !id}>{pendingRequestId === id ? "Fulfilling..." : "Fulfill bulk request"}</Button></div>
                )}
              </div>
            );
          }) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No fulfillment items available.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
