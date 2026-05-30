"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/constants/query-keys";
import { getProducts } from "@/src/features/products/api";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: () => getProducts(),
    enabled: true,
  });
}