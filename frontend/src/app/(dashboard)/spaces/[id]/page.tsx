"use client";

import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { PageHeader } from "@/src/components/layout/page-header";
import { createJoinRequest, getSpaceById } from "@/src/features/spaces/api";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/constants/query-keys";

export default function SpaceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: mySpaces = [] } = useMySpaces();
  const joinedSpaceIds = useMemo(
    () => new Set(mySpaces.map((space) => space.id || space._id).filter(Boolean)),
    [mySpaces],
  );

  const { data: space, isLoading, isError } = useQuery({
    queryKey: queryKeys.spaces.detail(params.id),
    queryFn: () => getSpaceById(params.id),
    enabled: Boolean(params.id),
  });

  const joinMutation = useMutation({
    mutationFn: () => createJoinRequest(params.id, { message: "Please grant access to this space." }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", "my"] });
      router.refresh();
    },
  });

  if (!params.id) {
    notFound();
  }

  const isJoined = joinedSpaceIds.has(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Space detail"
        title={isLoading ? `Space: ${params.id}` : `Space: ${space?.name || params.id}`}
        description="Starter detail surface for inventory, requests, members, and workflow visibility within a space."
        actions={
          !isJoined ? (
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? "Requesting..." : "Request to join"}
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Loading space details...</CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <CardContent className="p-6 text-sm">Space could not be loaded.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{space?.code || params.id}</CardTitle>
            <CardDescription>
              {space?.description || "This space can host products, inventory, requests, members, and notifications."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span>{isJoined ? "You are already a member of this space." : "You can request access from this screen."}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
