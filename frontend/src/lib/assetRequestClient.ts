import { apiClient } from "./api";

export async function listAssetRequests(options?: { spaceId?: string; page?: number; limit?: number }) {
  const { spaceId, ...params } = options ?? {};
  const res = await apiClient.get(`/asset-requests`, { params, headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function getAssetRequest(id: string, spaceId?: string) {
  const res = await apiClient.get(`/asset-requests/${id}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function createAssetRequest(
  payload: {
    productId: string;
    requestedQuantity: number;
    businessJustification: string;
    remarks?: string;
    priority?: string;
  },
  spaceId?: string
) {
  const res = await apiClient.post(`/asset-requests`, payload, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}
