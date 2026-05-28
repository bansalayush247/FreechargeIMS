import { useAuthStore } from "@/src/store/auth-store";
import type { AuthSession } from "@/src/types/auth";

export function getSession() {
  return useAuthStore.getState().session;
}

export function getAccessToken() {
  return useAuthStore.getState().session?.accessToken ?? null;
}

export function getRefreshToken() {
  return useAuthStore.getState().session?.refreshToken ?? null;
}

export function setSession(session: AuthSession) {
  useAuthStore.getState().setSession(session);
}

export function clearSession() {
  useAuthStore.getState().clearSession();
}