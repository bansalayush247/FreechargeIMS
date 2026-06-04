"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { fulfillAssetRequest, listAssetRequests } from "@/src/lib/assetRequestClient";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function FulfillmentQueuePage() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({ queryKey: ["asset-requests", activeSpaceId], queryFn: () => listAssetRequests({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }) });
  const requests = getItems(data) as Array<{ _id?: string; id?: string; status?: string; productId?: { name?: string } | string; requestedQuantity?: number; businessJustification?: string }>;
  const fulfillment = requests.filter((request) => /fulfill|approved|ready/i.test(request.status || ""));
  const fulfillMutation = useMutation({
    mutationFn: (requestId: string) => fulfillAssetRequest(requestId, {}, activeSpaceId ?? undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["asset-requests", activeSpaceId] });
    },
  });
  const pendingRequestId = fulfillMutation.isPending ? fulfillMutation.variables : "";

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Requests" title="Fulfillment queue" description="Warehouse teams fulfill approved requests by allocating assets and closing the workflow." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view fulfillment work.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Fulfillment queue could not be loaded.</div> : fulfillment.length ? fulfillment.map((request) => (
            <div key={request._id || request.id} className="rounded-2xl border border-orange-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{typeof request.productId === "string" ? request.productId : request.productId?.name || "Request"}</p>
                  <p className="text-sm text-slate-600">Quantity: {request.requestedQuantity ?? 0}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{request.status || "READY"}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{request.businessJustification || "No justification provided."}</p>
              <div className="mt-4">
                <Button size="sm" onClick={() => fulfillMutation.mutate(request._id || request.id || "")} disabled={pendingRequestId === (request._id || request.id) || !(request._id || request.id)}>
                  {pendingRequestId === (request._id || request.id) ? "Fulfilling..." : "Fulfill"}
                </Button>
              </div>
            </div>
          )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No fulfillment items available.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
