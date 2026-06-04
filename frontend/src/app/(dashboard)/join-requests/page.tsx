"use client";

import { getApiItems } from "@/src/lib/api-data";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listJoinRequests, reviewJoinRequest } from "@/src/features/spaces/api";
import { queryKeys } from "@/src/constants/query-keys";

const getItems = getApiItems;

export default function JoinRequestsPage() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({ queryKey: ["space-join-requests", activeSpaceId], queryFn: () => listJoinRequests(activeSpaceId as string), enabled: Boolean(activeSpaceId) });
  const requests = getItems(data) as Array<{ _id?: string; id?: string; status?: string; userId?: { firstName?: string; lastName?: string; email?: string }; message?: string; reason?: string }>;

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "approve" | "reject" }) => reviewJoinRequest(activeSpaceId as string, requestId, action),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["space-join-requests", activeSpaceId] }),
        queryClient.invalidateQueries({ queryKey: ["members", activeSpaceId] }),
        queryClient.invalidateQueries({ queryKey: ["space-members", activeSpaceId] }),
        queryClient.invalidateQueries({ queryKey: ["space-user-roles", activeSpaceId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.my }),
      ]);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Join requests" description="Users request access to spaces and admins approve or reject membership." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to review join requests.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Join requests could not be loaded.</div> : requests.length ? requests.map((request) => (
            <div key={request._id || request.id} className="rounded-2xl border border-orange-100 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{[request.userId?.firstName, request.userId?.lastName].filter(Boolean).join(" ") || request.userId?.email || "Join request"}</p>
                  <p className="text-sm text-slate-600">{request.message || request.reason || "No message provided."}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{request.status || "PENDING"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => reviewMutation.mutate({ requestId: request._id || request.id || "", action: "approve" })} disabled={reviewMutation.isPending}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ requestId: request._id || request.id || "", action: "reject" })} disabled={reviewMutation.isPending}>Reject</Button>
              </div>
            </div>
          )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No join requests found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
