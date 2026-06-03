import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl } from "@/src/config/env";
import { clearSession, getAccessToken, getRefreshToken, setSession } from "@/src/services/http/session";
import type { ApiErrorResponse } from "@/src/types/api";
import type { AuthSession } from "@/src/types/auth";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function buildBaseUrl() {
  return `${apiBaseUrl.replace(/\/$/, "")}/api/v1`;
}

function extractSessionRoot(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {} as Record<string, unknown>;
  }

  const data = (payload as { data?: unknown }).data;

  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }

  return payload as Record<string, unknown>;
}

function normalizeSession(payload: unknown): AuthSession | null {
  const root = extractSessionRoot(payload);
  const accessToken =
    typeof root.accessToken === "string"
      ? root.accessToken
      : typeof root.token === "string"
        ? root.token
        : null;
  const refreshToken = typeof root.refreshToken === "string" ? root.refreshToken : null;
  const user = root.user ?? null;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    user: (user as AuthSession["user"]) ?? null,
  };
}

function normalizeCurrentUser(payload: unknown): AuthSession["user"] {
  const root = extractSessionRoot(payload);
  const user = root.user && typeof root.user === "object" ? root.user as NonNullable<AuthSession["user"]> : null;

  if (!user) {
    return null;
  }

  return {
    ...user,
    permissionsBySpace: root.permissionsBySpace && typeof root.permissionsBySpace === "object"
      ? root.permissionsBySpace as NonNullable<AuthSession["user"]>["permissionsBySpace"]
      : undefined,
    rolesBySpace: root.rolesBySpace && typeof root.rolesBySpace === "object"
      ? root.rolesBySpace as NonNullable<AuthSession["user"]>["rolesBySpace"]
      : undefined,
    memberships: Array.isArray(root.memberships) ? root.memberships : undefined,
    isGlobalSuperAdmin: Boolean(root.isGlobalSuperAdmin || user.isGlobalSuperAdmin),
  };
}

const refreshClient = axios.create({
  baseURL: buildBaseUrl(),
});

export const apiClient = axios.create({
  baseURL: buildBaseUrl(),
});

function getActiveSpaceId() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("freechargeims.activeSpaceId");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    // Zustand persist may store the state object (e.g. { activeSpaceId: '...' })
    if (typeof parsed === "string") return parsed;

    if (parsed && typeof parsed === "object") {
      if ("activeSpaceId" in parsed) return (parsed as { activeSpaceId?: string }).activeSpaceId ?? null;
      // older/newer persist shapes may nest under `state`
      if ("state" in parsed) {
        const state = (parsed as { state?: unknown }).state;
        if (state && typeof state === "object" && "activeSpaceId" in state) {
          return (state as { activeSpaceId?: string }).activeSpaceId ?? null;
        }
      }
    }

    // fallback to raw string value
    return raw;
  } catch {
    return raw;
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  const activeSpaceId = getActiveSpaceId();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (activeSpaceId && !config.headers["x-space-id"]) {
    config.headers["x-space-id"] = activeSpaceId;
  }

  return config;
});

async function requestTokenRefresh() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await refreshClient.post("/auth/refresh", { refreshToken });
  const session = normalizeSession(response.data);

  if (session) {
    // If the refresh endpoint does not return the user object (common when
    // only tokens are rotated), attempt to fetch the current user using the
    // newly issued access token so we don't overwrite the stored user with
    // `null` and inadvertently show a different account in the UI.
    if (!session.user) {
      try {
        const meResp = await refreshClient.get("/auth/me", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        session.user = normalizeCurrentUser(meResp.data);
      } catch (err) {
        // ignore — we still persist tokens even if fetching /me fails
      }
    }

    setSession({
      ...session,
      refreshToken: session.refreshToken ?? refreshToken,
    });
  }

  return session;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= requestTokenRefresh().finally(() => {
          refreshPromise = null;
        });

        const session = await refreshPromise;

        if (session) {
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        clearSession();
        unauthorizedHandler?.();
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response?.data;

    if (typeof response?.message === "string") {
      return response.message;
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
