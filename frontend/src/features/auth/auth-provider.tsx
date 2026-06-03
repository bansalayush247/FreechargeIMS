"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { getCurrentUser, login as loginRequest, signup as signupRequest } from "@/src/services/auth.service";
import { setUnauthorizedHandler } from "@/src/services/http/client";
import { useAuthStore } from "@/src/store/auth-store";
import type { AuthSession, LoginInput, SignupInput } from "@/src/types/auth";

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthSession["user"];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  signup: (input: SignupInput) => Promise<AuthSession>;
  refreshCurrentUser: () => Promise<AuthSession["user"]>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const isHydrated = useAuthStore((state) => state.hasHydrated);
  const setStoreSession = useAuthStore((state) => state.setSession);
  const clearStoreSession = useAuthStore((state) => state.clearSession);

  const refreshCurrentUser = useCallback(async () => {
    const user = await getCurrentUser();
    const currentSession = useAuthStore.getState().session;

    if (currentSession && user) {
      setStoreSession({ ...currentSession, user });
    }

    return user;
  }, [setStoreSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoreSession();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearStoreSession]);

  useEffect(() => {
    if (!isHydrated || !session?.accessToken) {
      return;
    }

    let cancelled = false;

    getCurrentUser()
      .then((user) => {
        if (!cancelled && user) {
          setStoreSession({ ...session, user });
        }
      })
      .catch(() => {
        // Keep the existing token session. API interceptors handle hard 401s.
      });

    return () => {
      cancelled = true;
    };
  }, [isHydrated, session?.accessToken, setStoreSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isHydrated,
      login: async (input) => {
        const nextSession = await loginRequest(input);
        setStoreSession(nextSession);
        const user = await getCurrentUser().catch(() => nextSession.user);
        const hydratedSession = { ...nextSession, user };
        setStoreSession(hydratedSession);
        return hydratedSession;
      },
      signup: async (input) => {
        const nextSession = await signupRequest(input);
        setStoreSession(nextSession);
        const user = await getCurrentUser().catch(() => nextSession.user);
        const hydratedSession = { ...nextSession, user };
        setStoreSession(hydratedSession);
        return hydratedSession;
      },
      refreshCurrentUser,
      logout: () => {
        clearStoreSession();
      },
    }),
    [clearStoreSession, isHydrated, refreshCurrentUser, session, setStoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}
