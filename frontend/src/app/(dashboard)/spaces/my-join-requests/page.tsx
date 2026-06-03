"use client";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { getMyJoinRequests } from "@/src/features/spaces/api";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
export default function MyJoinRequestsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data = [] } = useQuery({
    queryKey: ["my-join-requests", activeSpaceId],
    queryFn: () => getMyJoinRequests(activeSpaceId as string),
    enabled: Boolean(activeSpaceId),
  });
  return <div className="space-y-4"><PageHeader eyebrow="Spaces" title="My join requests" description="Track pending and completed join requests." />
    {(data as Array<{ id?: string; _id?: string; spaceName?: string; status?: string }>).map((r) => <div key={r.id || r._id} className="border rounded p-3">{r.spaceName || "Space"} - {r.status || "pending"}</div>)}
  </div>;
}
