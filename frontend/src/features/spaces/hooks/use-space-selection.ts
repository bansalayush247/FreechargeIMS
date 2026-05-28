"use client";

import { useMemo, useState } from "react";
import type { SpaceListItem } from "@/src/features/spaces/api";
import { useSpaceStore } from "@/src/store/spaceStore";

const STORAGE_KEY = "freechargeims.activeSpaceId";
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function getSpaceId(space: SpaceListItem) {
  return space.id || space._id || null;
}

export function useSpaceSelection(spaces: SpaceListItem[]) {
  const persistedSpaceId = useSpaceStore((state) => state.activeSpaceId);
  const setPersistedSpaceId = useSpaceStore((state) => state.setActiveSpaceId);
  const [storedSpaceId, setStoredSpaceId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && OBJECT_ID_REGEX.test(value) ? value : null;
  });

  const activeSpaceId = persistedSpaceId || storedSpaceId || (spaces[0] ? getSpaceId(spaces[0]) : null);

  const activeSpace = useMemo(
    () => spaces.find((space) => getSpaceId(space) === activeSpaceId) ?? null,
    [activeSpaceId, spaces],
  );

  const setActiveSpaceId = (spaceId: string) => {
    setStoredSpaceId(spaceId);
    setPersistedSpaceId(spaceId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, spaceId);
    }
  };

  return {
    activeSpaceId,
    activeSpace,
    setActiveSpaceId,
  };
}
