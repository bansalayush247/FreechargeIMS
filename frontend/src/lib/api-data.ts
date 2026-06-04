export function getApiItems<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;

  for (const key of ["items", "products", "results", "rows"]) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  if ("data" in record) {
    return getApiItems<T>(record.data);
  }

  return [];
}
