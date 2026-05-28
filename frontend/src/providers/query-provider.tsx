"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createAppQueryClient } from "@/src/lib/react-query/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createAppQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
