"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/constants/query-keys";
import { getWarehouses } from "@/src/features/warehouses/api";

export function useWarehouses(options?: { spaceId?: string }) {
  return useQuery({
    queryKey: options?.spaceId ? ["warehouses", options.spaceId] : queryKeys.warehouses.all,
    queryFn: () => getWarehouses(options?.spaceId),
    enabled: Boolean(options?.spaceId),
  });
}