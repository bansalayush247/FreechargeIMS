import { apiClient } from "./api";

export async function listAssetRequests(options?: { spaceId?: string; employeeId?: string; page?: number; limit?: number }) {
  const { spaceId, employeeId, ...params } = options ?? {};
  const res = await apiClient.get(`/asset-requests`, { params, headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function getAssetRequest(id: string, spaceId?: string) {
  const res = await apiClient.get(`/asset-requests/${id}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function createAssetRequest(
  payload: {
    requestType: string;
    merchantId?: string;
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

export async function managerApproveAssetRequest(id: string, payload?: { remarks?: string }, spaceId?: string) {
  const res = await apiClient.patch(`/asset-requests/${id}/manager-approve`, payload ?? {}, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

export async function itApproveAssetRequest(id: string, payload?: { remarks?: string }, spaceId?: string) {
  const res = await apiClient.patch(`/asset-requests/${id}/it-approve`, payload ?? {}, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

export async function fulfillAssetRequest(id: string, payload?: { remarks?: string }, spaceId?: string) {
  const res = await apiClient.patch(`/asset-requests/${id}/fulfill`, payload ?? {}, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

export async function rejectAssetRequest(id: string, payload: { stepKey: string; rejectionReason: string; remarks?: string }, spaceId?: string) {
  const res = await apiClient.patch(`/asset-requests/${id}/reject`, payload, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

// Note: cancellation and forwarding APIs removed from client — use workflow endpoints instead
