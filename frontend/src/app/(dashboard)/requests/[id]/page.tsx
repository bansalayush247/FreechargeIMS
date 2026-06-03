"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getAssetRequest } from "@/src/lib/assetRequestClient";

export default function RequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const { activeSpaceId } = useCurrentSpace();
  const id = params.id;
  const { data, isLoading, isError } = useQuery({ queryKey: ["asset-request", id, activeSpaceId], queryFn: () => getAssetRequest(id, activeSpaceId ?? undefined), enabled: Boolean(id) });
  const request = data && typeof data === "object" && "data" in data ? (data as { data?: Record<string, unknown> }).data : data;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Requests" title={`Request ${id}`} description="Live request details from the backend." />
      <Card>
        <CardHeader>
          <CardTitle>Request summary</CardTitle>
          <CardDescription>Current values returned by the API.</CardDescription>
        </CardHeader>
        <CardContent>
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load request details.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Request could not be loaded.</div> : request && typeof request === "object" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</p><p className="mt-1 font-medium text-slate-900">{String((request as { status?: string }).status || "UNKNOWN")}</p></div>
              <div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Quantity</p><p className="mt-1 font-medium text-slate-900">{String((request as { requestedQuantity?: number }).requestedQuantity ?? 0)}</p></div>
              <div className="md:col-span-2"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Justification</p><p className="mt-1 text-sm text-slate-700">{String((request as { businessJustification?: string }).businessJustification || "No justification provided.")}</p></div>
              <div className="md:col-span-2"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Remarks</p><p className="mt-1 text-sm text-slate-700">{String((request as { remarks?: string }).remarks || "-")}</p></div>
            </div>
          ) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No request found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}