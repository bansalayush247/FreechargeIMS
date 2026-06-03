"use client";

import { ConfirmProvider } from "@/src/components/confirmProvider";
import { ToastProvider } from "@/src/components/toastProvider";
import { AuthProvider } from "@/src/features/auth/auth-provider";
import { QueryProvider } from "@/src/providers/query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}