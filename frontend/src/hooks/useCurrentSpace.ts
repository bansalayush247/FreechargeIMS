"use client";

import { useEffect, useMemo } from "react";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { useSpaceStore } from "@/src/store/spaceStore";

function getSpaceId(space: { id?: string; _id?: string }) {
  return space.id || space._id || null;
}

export function useCurrentSpace() {
  const activeSpaceId = useSpaceStore((state) => state.activeSpaceId);
  const setActiveSpaceId = useSpaceStore((state) => state.setActiveSpaceId);
  const { data: mySpaces = [] } = useMySpaces();

  const resolvedSpaceId = useMemo(() => {
    if (activeSpaceId && mySpaces.some((space) => getSpaceId(space) === activeSpaceId)) {
      return activeSpaceId;
    }

    return mySpaces[0] ? getSpaceId(mySpaces[0]) : null;
  }, [activeSpaceId, mySpaces]);

  const activeSpace = useMemo(() => {
    if (!resolvedSpaceId) {
      return null;
    }

    return mySpaces.find((space) => getSpaceId(space) === resolvedSpaceId) ?? null;
  }, [mySpaces, resolvedSpaceId]);

  useEffect(() => {
    if (resolvedSpaceId && resolvedSpaceId !== activeSpaceId) {
      setActiveSpaceId(resolvedSpaceId);
    }
  }, [activeSpaceId, resolvedSpaceId, setActiveSpaceId]);

  return { activeSpaceId: resolvedSpaceId, setActiveSpaceId, activeSpace, mySpaces };
}
