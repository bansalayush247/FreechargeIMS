"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Boxes, CalendarClock, PackageCheck, UserRoundCheck } from "lucide-react";
import { PageHeader } from "@/src/components/layout/page-header";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getAssetRequest } from "@/src/lib/assetRequestClient";

type Entity = { _id?: string; id?: string; name?: string; sku?: string; trackingType?: string; firstName?: string; lastName?: string; email?: string; employeeId?: string; merchantCode?: string; assetTag?: string; serialNumber?: string; status?: string; condition?: string };
type AssignedAsset = { _id?: string; id?: string; status?: string; quantity?: number; assignedAt?: string; remarks?: string; assignedToUserId?: Entity; assignedToMerchantId?: Entity; assignedByUserId?: Entity; sourceInventoryItemId?: Entity };
type Request = { requestNumber?: string; status?: string; requestType?: string; requestedQuantity?: number; fulfilledQuantity?: number; remainingQuantity?: number; businessJustification?: string; remarks?: string; fulfilledAt?: string; productId?: Entity; employeeId?: Entity; merchantId?: Entity; assignedAssets?: AssignedAsset[] };

function label(entity?: Entity) {
  if (!entity) return "";
  return [entity.firstName, entity.lastName].filter(Boolean).join(" ") || entity.name || entity.email || entity.employeeId || entity.merchantCode || "";
}

function readable(value?: string) {
  return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function Detail({ title, value }: { title: string; value?: string | number }) {
  return <div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{title}</p><p className="mt-1 font-medium text-slate-900">{value ?? "-"}</p></div>;
}

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { activeSpaceId } = useCurrentSpace();
  const requestQuery = useQuery({ queryKey: ["asset-request", id, activeSpaceId], queryFn: () => getAssetRequest(id, activeSpaceId ?? undefined), enabled: Boolean(id && activeSpaceId) });
  const payload = requestQuery.data && typeof requestQuery.data === "object" && "data" in requestQuery.data ? (requestQuery.data as { data?: Request }).data : requestQuery.data;
  const request = payload as Request | undefined;
  const assignedAssets = request?.assignedAssets ?? [];
  const requester = label(request?.merchantId) || label(request?.employeeId);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Request lifecycle" title={request?.requestNumber || `Request ${id}`} description="Request status, fulfillment progress, and every asset assigned through this request." />
      {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load request details.</div> : requestQuery.isLoading ? <Skeleton className="h-80 w-full" /> : requestQuery.isError || !request ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Request could not be loaded.</div> : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-5"><Boxes className="h-5 w-5 text-orange-500" /><p className="mt-3 text-2xl font-semibold text-slate-900">{request.requestedQuantity ?? 0}</p><p className="text-sm text-slate-600">Requested quantity</p></CardContent></Card>
            <Card><CardContent className="p-5"><PackageCheck className="h-5 w-5 text-orange-500" /><p className="mt-3 text-2xl font-semibold text-slate-900">{request.fulfilledQuantity ?? assignedAssets.length}</p><p className="text-sm text-slate-600">Fulfilled quantity</p></CardContent></Card>
            <Card><CardContent className="p-5"><UserRoundCheck className="h-5 w-5 text-orange-500" /><p className="mt-3 font-semibold text-slate-900">{requester || "Unknown requester"}</p><p className="text-sm text-slate-600">{readable(request.requestType)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Request summary</CardTitle><CardDescription>Product, workflow status, and fulfillment progress.</CardDescription></CardHeader>
            <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Detail title="Product" value={request.productId?.name} />
              <Detail title="SKU" value={request.productId?.sku} />
              <Detail title="Tracking" value={readable(request.productId?.trackingType)} />
              <Detail title="Status" value={readable(request.status)} />
              <Detail title="Requested" value={request.requestedQuantity ?? 0} />
              <Detail title="Fulfilled" value={request.fulfilledQuantity ?? assignedAssets.length} />
              <Detail title="Remaining" value={request.remainingQuantity ?? 0} />
              <Detail title="Fulfilled at" value={formatDate(request.fulfilledAt)} />
              <div className="sm:col-span-2 lg:col-span-4"><Detail title="Business justification" value={request.businessJustification || "-"} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Assigned assets</CardTitle><CardDescription>{request.productId?.trackingType === "SERIALIZED" ? "Every serialized physical asset allocated during fulfillment." : "Quantity-based allocations recorded for this request."}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {assignedAssets.length ? assignedAssets.map((assignment) => {
                const asset = assignment.sourceInventoryItemId;
                const assetId = asset?._id || asset?.id;
                const recipient = label(assignment.assignedToUserId) || label(assignment.assignedToMerchantId);
                return (
                  <div key={assignment._id || assignment.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-white p-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{asset?.assetTag || asset?.serialNumber || request.productId?.name || "Bulk allocation"}</p><Badge variant="secondary">{readable(assignment.status)}</Badge></div>
                      <p className="mt-1 text-sm text-slate-600">{asset?.serialNumber || `${assignment.quantity ?? 1} units`} · Assigned to {recipient || "unknown recipient"}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarClock className="h-3.5 w-3.5" />{formatDate(assignment.assignedAt)} · By {label(assignment.assignedByUserId) || "unknown user"}</p>
                    </div>
                    {assetId ? <Link href={`/inventory/assets/${assetId}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Asset lifecycle<ArrowRight className="h-4 w-4" /></Link> : null}
                  </div>
                );
              }) : <p className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No assets have been assigned through this request yet.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
