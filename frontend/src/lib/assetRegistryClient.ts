import { apiClient } from "@/src/lib/api";

export async function listMyAssetRegistry(options?: { spaceId?: string; page?: number; limit?: number; status?: string }) {
  const { spaceId, ...params } = options ?? {};
  const res = await apiClient.get("/asset-registry/me", {
    params,
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });

  return res.data;
}
