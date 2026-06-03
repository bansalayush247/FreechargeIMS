import type { Warehouse } from "@/src/features/warehouses/types";
import { apiClient } from "@/src/services/http/client";

function unwrapItems(payload: unknown) {
  const root = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : payload;
  const items = root && typeof root === "object" && "items" in root ? (root as { items?: unknown }).items : [];

  return Array.isArray(items) ? (items as Warehouse[]) : [];
}

export async function getWarehouses(spaceId?: string) {
  const response = await apiClient.get("/warehouse", {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return unwrapItems(response.data);
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
