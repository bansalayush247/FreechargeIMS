import { apiBaseUrl as configuredApiBaseUrl, env } from "@/src/config/env";

export { apiClient, getApiErrorMessage, setUnauthorizedHandler } from "@/src/services/http/client";
export { env };
export const apiBaseUrl = configuredApiBaseUrl;

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  return `${base}/api/v1${normalizedPath}`;
}
