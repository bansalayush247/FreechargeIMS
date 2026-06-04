import type { Warehouse } from "@/src/features/warehouses/types";
import { getApiItems } from "@/src/lib/api-data";
import { apiClient } from "@/src/services/http/client";

export async function getWarehouses(spaceId?: string) {
  const response = await apiClient.get("/warehouse", {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return getApiItems<Warehouse>(response.data);
}

export async function getWarehouse(id: string, spaceId?: string) {
  const response = await apiClient.get(`/warehouse/${id}`, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return response.data?.data ?? response.data;
}

export async function updateWarehouse(id: string, payload: Record<string, unknown>, spaceId?: string) {
  const response = await apiClient.patch(`/warehouse/${id}`, payload, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return response.data?.data ?? response.data;
}

export async function deleteWarehouse(id: string, spaceId?: string) {
  const response = await apiClient.delete(`/warehouse/${id}`, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return response.data?.data ?? response.data;
}
