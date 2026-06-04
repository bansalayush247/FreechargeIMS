import { apiClient } from "./api";

export async function getInventoryItemAuditTrail(inventoryItemId: string, spaceId?: string) {
  const res = await apiClient.get(`/inventoryTransactions/item/${inventoryItemId}`, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

export async function listInventoryTransactions(params?: { page?: number; limit?: number; spaceId?: string; productId?: string }) {
  const { spaceId, ...query } = params ?? {};
  const res = await apiClient.get("/inventoryTransactions", {
    params: query,
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

export async function getInventoryTransaction(id: string, spaceId?: string) {
  const res = await apiClient.get(`/inventoryTransactions/${id}`, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}

export async function createInventoryTransaction(payload: Record<string, unknown>, spaceId?: string) {
  const res = await apiClient.post("/inventoryTransactions", payload, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}
