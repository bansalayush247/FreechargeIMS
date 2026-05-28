import { apiClient } from "./api";

export async function listInventory(options?: { spaceId?: string; page?: number; limit?: number }) {
  const { spaceId, ...params } = options ?? {};
  const res = await apiClient.get(`/inventory-items`, { params, headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function createInventoryItem(
  payload: {
    productId: string;
    warehouseId: string;
    quantity?: number;
    serialNumber?: string;
    assetTag?: string;
    qrCode?: string;
    status?: string;
    condition?: string;
    remarks?: string;
  },
  spaceId?: string
) {
  const res = await apiClient.post(`/inventory-items`, payload, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

export async function getInventoryItem(id: string, spaceId?: string) {
  const res = await apiClient.get(`/inventory-items/${id}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function updateInventoryItem(id: string, payload: Record<string, unknown>, spaceId?: string) {
  const res = await apiClient.put(`/inventory-items/${id}`, payload, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function deleteInventoryItem(id: string, spaceId?: string) {
  const res = await apiClient.delete(`/inventory-items/${id}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function assignInventoryItem(id: string, payload: { assigneeUserId: string }, spaceId?: string) {
  const res = await apiClient.post(`/inventory-items/${id}/assign`, payload, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}

export async function updateInventoryStatus(id: string, status: string, spaceId?: string) {
  const res = await apiClient.patch(`/inventory-items/${id}/status`, { status }, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data;
}
