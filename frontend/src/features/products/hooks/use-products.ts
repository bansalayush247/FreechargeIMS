"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/constants/query-keys";
import { getProducts } from "@/src/features/products/api";

export function useProducts(options?: { spaceId?: string }) {
  return useQuery({
    queryKey: options?.spaceId ? ["products", options.spaceId] : queryKeys.products.all,
    queryFn: () => getProducts(options?.spaceId),
    enabled: Boolean(options?.spaceId),
  });
}