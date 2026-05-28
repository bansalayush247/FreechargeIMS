"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/constants/query-keys";
import { getSpaces } from "@/src/features/spaces/api";

export function useSpaces() {
  return useQuery({
    queryKey: queryKeys.spaces.all,
    queryFn: getSpaces,
  });
}