import { apiClient } from "./api";

export async function listProducts(options?: { spaceId?: string; page?: number; limit?: number }) {
  const { spaceId, ...params } = options ?? {};
  const res = await apiClient.get(`/product`, { params, headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}
