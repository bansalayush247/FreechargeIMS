import type { Product } from "@/src/features/products/types";
import { getApiItems } from "@/src/lib/api-data";
import { apiClient } from "@/src/services/http/client";

export async function getProducts() {
  const response = await apiClient.get("/product");
  return getApiItems<Product>(response.data);
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
