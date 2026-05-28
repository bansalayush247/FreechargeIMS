"use client";

import { useMemo } from "react";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { useSpaceStore } from "@/src/store/spaceStore";

export function useCurrentSpace() {
  const activeSpaceId = useSpaceStore((state) => state.activeSpaceId);
  const setActiveSpaceId = useSpaceStore((state) => state.setActiveSpaceId);
  const { data: mySpaces = [] } = useMySpaces();

  const activeSpace = useMemo(() => {
    if (!activeSpaceId) {
      return null;
    }

    return mySpaces.find((space) => (space.id || space._id) === activeSpaceId) ?? null;
  }, [activeSpaceId, mySpaces]);

  return { activeSpaceId, setActiveSpaceId, activeSpace, mySpaces };
}
