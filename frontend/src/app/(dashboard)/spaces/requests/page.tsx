"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { listJoinRequests, reviewJoinRequest } from "@/src/features/spaces/api";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { queryKeys } from "@/src/constants/query-keys";
export default function SpaceJoinRequestsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["space-join-requests", activeSpaceId],
    queryFn: () => listJoinRequests(activeSpaceId as string),
    enabled: Boolean(activeSpaceId),
  });
  const review = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "approve" | "reject" }) =>
      reviewJoinRequest(activeSpaceId as string, requestId, action),
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
  return <div className="space-y-4"><PageHeader eyebrow="Spaces" title="Join request review" description="Approve/reject membership requests." />
    {(data as Array<{ id?: string; _id?: string; userEmail?: string; status?: string }>).map((r) => <div key={r.id || r._id} className="border rounded p-3 flex justify-between"><span>{r.userEmail} ({r.status || "pending"})</span><div className="flex gap-2"><Button onClick={() => review.mutate({ requestId: (r.id || r._id) as string, action: "approve" })}>Approve</Button><Button variant="outline" onClick={() => review.mutate({ requestId: (r.id || r._id) as string, action: "reject" })}>Reject</Button></div></div>)}
  </div>;
}
