"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/constants/query-keys";
import { getMySpaces } from "@/src/features/spaces/api";
import { useAuth } from "@/src/features/auth/auth-provider";

export function useMySpaces() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const userId = user?._id || user?.id || null;

  return useQuery({
    queryKey: userId ? [...queryKeys.spaces.my, userId] : queryKeys.spaces.my,
    queryFn: getMySpaces,
    enabled: isHydrated && isAuthenticated && Boolean(userId),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}
