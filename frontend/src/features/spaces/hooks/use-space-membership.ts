"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { getMyJoinRequests, type SpaceListItem } from "@/src/features/spaces/api";

export function useSpaceMembership(spaceId?: string | null) {
  const { data: mySpaces = [], isLoading: mySpacesLoading } = useMySpaces();

  const joinedSpaceIds = useMemo(
    () => new Set((mySpaces as SpaceListItem[]).map((s) => s.id || s._id).filter(Boolean)),
    [mySpaces],
  );

  const isMembershipKnown = !mySpacesLoading;
  const isJoined = Boolean(isMembershipKnown && spaceId && joinedSpaceIds.has(spaceId));

  const { data: myJoinRequests = [] } = useQuery({
    queryKey: ["space-my-join-request", spaceId],
    queryFn: () => getMyJoinRequests(spaceId as string),
    enabled: Boolean(spaceId && isMembershipKnown && !isJoined),
    refetchInterval: isJoined ? false : 10000,
    refetchOnWindowFocus: true,
  });

  const pendingJoin = (myJoinRequests as Array<{ status?: string }>).some(
    (item) => String(item.status || "").toUpperCase() === "PENDING",
  );

  return { isMembershipKnown, isJoined, pendingJoin, myJoinRequests };
}
