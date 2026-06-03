const defaultApiBaseUrl = "http://localhost:5000";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE ?? defaultApiBaseUrl;

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  return `${base}/api/v1${normalizedPath}`;
}
