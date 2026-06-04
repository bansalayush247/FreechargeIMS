"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listAssetRequests } from "@/src/lib/assetRequestClient";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const { activeSpaceId } = useCurrentSpace();
  const currentUserId = user?.id || user?._id;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["asset-requests", "mine", activeSpaceId, currentUserId],
    queryFn: () => listAssetRequests({ spaceId: activeSpaceId ?? undefined, employeeId: currentUserId, page: 1, limit: 25 }),
    enabled: Boolean(activeSpaceId && currentUserId),
  });
  const requests = getItems(data) as Array<{ _id?: string; id?: string; status?: string; productId?: { name?: string; sku?: string } | string; requestedQuantity?: number; businessJustification?: string; remarks?: string }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Requests" title="My requests" description="A personal queue of submitted requests, approvals, and fulfillment updates." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view your requests.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Requests could not be loaded.</div> : requests.length ? requests.map((request) => (
            <div key={request._id || request.id} className="rounded-2xl border border-orange-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{typeof request.productId === "string" ? request.productId : request.productId?.name || "Request"}</p>
                  <p className="text-sm text-slate-600">Quantity: {request.requestedQuantity ?? 0}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{request.status || "PENDING"}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{request.businessJustification || request.remarks || "No justification provided."}</p>
            </div>
          )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No requests found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
