import { apiClient } from "@/src/lib/api";
import { getApiItems } from "@/src/lib/api-data";

export type MerchantOption = {
  _id?: string;
  id?: string;
  name?: string;
  merchantCode?: string;
};

export async function listMerchants(options?: { spaceId?: string; page?: number; limit?: number }) {
  const { spaceId, ...params } = options ?? {};
  const res = await apiClient.get("/merchants", {
    params,
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });

  return getApiItems<MerchantOption>(res.data);
}
