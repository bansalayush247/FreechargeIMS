"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routePaths } from "@/src/constants/routes";
import { useAuth } from "@/src/features/auth/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace(routePaths.auth.login);
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}