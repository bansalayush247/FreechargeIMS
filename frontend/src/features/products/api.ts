import type { Product } from "@/src/features/products/types";
import { apiClient } from "@/src/services/http/client";

function unwrapItems(payload: unknown) {
  const root = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : payload;
  const items = root && typeof root === "object" && "items" in root ? (root as { items?: unknown }).items : [];

  return Array.isArray(items) ? (items as Product[]) : [];
}

export async function getProducts(spaceId?: string) {
  const response = await apiClient.get("/product", {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return unwrapItems(response.data);
}

export async function getProduct(id: string, spaceId?: string) {
  const response = await apiClient.get(`/product/${id}`, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return response.data?.data ?? response.data;
}

export async function updateProduct(id: string, payload: Record<string, unknown>, spaceId?: string) {
  const response = await apiClient.put(`/product/${id}`, payload, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return response.data?.data ?? response.data;
}

export async function deleteProduct(id: string, spaceId?: string) {
  const response = await apiClient.delete(`/product/${id}`, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return response.data?.data ?? response.data;
}
