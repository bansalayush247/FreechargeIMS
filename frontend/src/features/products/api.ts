import type { Product } from "@/src/features/products/types";
import { apiClient } from "@/src/services/http/client";

function unwrapItems(payload: unknown) {
  const root = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : payload;
  const items = root && typeof root === "object"
    ? ("products" in root
      ? (root as { products?: unknown }).products
      : "items" in root
        ? (root as { items?: unknown }).items
        : [])
    : [];

  return Array.isArray(items) ? (items as Product[]) : [];
}

export async function getProducts() {
  const response = await apiClient.get("/product");
  return unwrapItems(response.data);
}

export async function createProduct(payload: Record<string, unknown>) {
  const response = await apiClient.post("/product", payload);
  return response.data?.data ?? response.data;
}

export async function getProduct(id: string) {
  const response = await apiClient.get(`/product/${id}`);
  return response.data?.data ?? response.data;
}

export async function updateProduct(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.patch(`/product/${id}`, payload);
  return response.data?.data ?? response.data;
}

export async function deleteProduct(id: string) {
  const response = await apiClient.delete(`/product/${id}`);
  return response.data?.data ?? response.data;
}
