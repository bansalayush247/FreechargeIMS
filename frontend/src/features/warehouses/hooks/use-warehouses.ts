"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/constants/query-keys";
import { getWarehouses } from "@/src/features/warehouses/api";

export function useWarehouses() {
  return useQuery({
    queryKey: queryKeys.warehouses.all,
    queryFn: getWarehouses,
  });
}