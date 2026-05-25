"use client";

import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, setApiToken } from "../lib/api";

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

export type SignupPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  employeeId: string;
  userType: string;
};

type LoginResult = {
  token: string;
  user: AuthUser | null;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (payload: SignupPayload) => Promise<LoginResult>;
  logout: () => void;
};

const TOKEN_STORAGE_KEY = "freechargeims.token";
const USER_STORAGE_KEY = "freechargeims.user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession() {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const userRaw = window.localStorage.getItem(USER_STORAGE_KEY);
  let user: AuthUser | null = null;

  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as AuthUser;
    } catch {
      user = null;
    }
  }

  return {
    token,
    user,
  };
}

function persistSession(token: string | null, user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function extractLoginData(responseData: unknown): LoginResult {
  const payload = responseData as any;

  // Response shapes observed:
  // 1) { success, message, data: { user, accessToken, refreshToken } }
  // 2) { token, user }
  // 3) { data: { token, user } }
  const token =
    payload?.data?.accessToken ?? payload?.accessToken ?? payload?.data?.token ?? payload?.token ?? null;

  const user = payload?.data?.user ?? payload?.user ?? (payload?.data?.data?.user ?? null) ?? null;

  if (!token) {
    throw new Error("Login response did not include a token.");
  }

  return { token, user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredSession();
    setToken(stored.token);
    setUser(stored.user);
    setApiToken(stored.token);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    persistSession(token, user);
    setApiToken(token);
  }, [isHydrated, token, user]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", { email, password });
    const nextSession = extractLoginData(response.data);

    setToken(nextSession.token);
    setUser(nextSession.user);
    setApiToken(nextSession.token);

    return nextSession;
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const response = await apiClient.post("/auth/signup", payload);
    const nextSession = extractLoginData(response.data);

    setToken(nextSession.token);
    setUser(nextSession.user);
    setApiToken(nextSession.token);

    return nextSession;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setApiToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isHydrated,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
    }),
    [isHydrated, login, logout, signup, token, user],
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

export function getAuthErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
