"use client";

import { getApiItems } from "@/src/lib/api-data";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listAssetRequests } from "@/src/lib/assetRequestClient";

const getItems = getApiItems;

export default function PendingApprovalsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({ queryKey: ["asset-requests", activeSpaceId], queryFn: () => listAssetRequests({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }) });
  const requests = useMemo(() => getItems(data) as Array<{ _id?: string; id?: string; status?: string; productId?: { name?: string } | string; requestedQuantity?: number; businessJustification?: string }>, [data]);
  const pending = requests.filter((request) => /pending|review|approve/i.test(request.status || ""));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Requests" title="Pending approvals" description="A focused queue for managers and IT to review the next actionable requests." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view approvals.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Approval queue could not be loaded.</div> : pending.length ? pending.map((request) => (
            <div key={request._id || request.id} className="rounded-2xl border border-orange-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{typeof request.productId === "string" ? request.productId : request.productId?.name || "Request"}</p>
                  <p className="text-sm text-slate-600">Quantity: {request.requestedQuantity ?? 0}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{request.status || "PENDING"}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{request.businessJustification || "No justification provided."}</p>
            </div>
          )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No pending approvals found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
