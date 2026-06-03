import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";
import type { AuthSession } from "@/src/types/auth";

type AuthState = {
  session: AuthSession | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "freechargeims.auth",
      storage: createJSONStorage(createUniversalStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);