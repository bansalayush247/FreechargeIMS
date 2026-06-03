import { apiClient } from "@/src/lib/api";

export type MerchantOption = {
  _id?: string;
  id?: string;
  name?: string;
  merchantCode?: string;
};

function unwrapItems(payload: unknown) {
  const root = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : payload;
  const items = root && typeof root === "object" && "items" in root ? (root as { items?: unknown }).items : root;

  return Array.isArray(items) ? items as MerchantOption[] : [];
}

export async function listMerchants(options?: { spaceId?: string; page?: number; limit?: number }) {
  const { spaceId, ...params } = options ?? {};
  const res = await apiClient.get("/merchants", {
    params,
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });

  return unwrapItems(res.data);
}
