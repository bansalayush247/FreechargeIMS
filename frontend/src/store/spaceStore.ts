import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SpaceState = {
  activeSpaceId: string | null;
  setActiveSpaceId: (spaceId: string | null) => void;
};

function createUniversalStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  return localStorage;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set) => ({
      activeSpaceId: null,
      setActiveSpaceId: (activeSpaceId) => set({ activeSpaceId }),
    }),
    {
      name: "freechargeims.activeSpaceId",
      storage: createJSONStorage(createUniversalStorage),
    },
  ),
);
