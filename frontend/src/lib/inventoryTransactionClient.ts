import { apiClient } from "./api";

export async function getInventoryItemAuditTrail(inventoryItemId: string, spaceId?: string) {
  const res = await apiClient.get(`/inventoryTransactions/item/${inventoryItemId}`, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data;
}
