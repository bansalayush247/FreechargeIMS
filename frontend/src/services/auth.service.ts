import { apiClient } from "@/src/services/http/client";
import type { AuthSession, LoginInput, SignupInput } from "@/src/types/auth";

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

function normalizeSession(responseData: unknown): AuthSession {
  const root = extractSessionRoot(responseData);
  const accessToken =
    typeof root.accessToken === "string"
      ? root.accessToken
      : typeof root.token === "string"
        ? root.token
        : null;

  if (!accessToken) {
    throw new Error("Authentication response did not include an access token.");
  }

  const refreshToken = typeof root.refreshToken === "string" ? root.refreshToken : null;

  return {
    accessToken,
    refreshToken,
    user: (root.user as AuthSession["user"]) ?? null,
  };
}

export function normalizeCurrentUser(responseData: unknown): AuthSession["user"] {
  const root = extractSessionRoot(responseData);
  const user = root.user && typeof root.user === "object" ? root.user as NonNullable<AuthSession["user"]> : null;

  if (!user) {
    return null;
  }

  const permissionsBySpace =
    root.permissionsBySpace && typeof root.permissionsBySpace === "object"
      ? root.permissionsBySpace as NonNullable<AuthSession["user"]>["permissionsBySpace"]
      : undefined;

  const rolesBySpace =
    root.rolesBySpace && typeof root.rolesBySpace === "object"
      ? root.rolesBySpace as NonNullable<AuthSession["user"]>["rolesBySpace"]
      : undefined;

  const memberships = Array.isArray(root.memberships) ? root.memberships : undefined;

  return {
    ...user,
    permissionsBySpace,
    rolesBySpace,
    memberships,
    isGlobalSuperAdmin: Boolean(root.isGlobalSuperAdmin || user.isGlobalSuperAdmin),
  };
}

export async function login(input: LoginInput) {
  const response = await apiClient.post("/auth/login", input);
  return normalizeSession(response.data);
}

export async function signup(input: SignupInput) {
  const response = await apiClient.post("/auth/signup", input);
  return normalizeSession(response.data);
}

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return normalizeCurrentUser(response.data);
}
