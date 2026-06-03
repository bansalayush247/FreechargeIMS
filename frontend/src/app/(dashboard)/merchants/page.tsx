"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { apiClient } from "@/src/services/http/client";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function MerchantsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["merchants"], queryFn: async () => (await apiClient.get("/merchants")).data });
  const merchants = getItems(data) as Array<{ _id?: string; id?: string; name?: string; code?: string; status?: string; city?: string; ownerName?: string; contactName?: string }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Catalog" title="Merchants" description="Merchant records group FOS-facing operations, requests, and asset histories in one place." />
      <Card>
        <CardContent className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Merchants could not be loaded.</div> : merchants.length ? merchants.map((merchant) => (
            <div key={merchant._id || merchant.id || merchant.code || merchant.name} className="rounded-2xl border border-orange-100 bg-white p-4">
              <p className="font-medium text-slate-900">{merchant.name || merchant.code || "Merchant"}</p>
              <p className="text-sm text-slate-600">{merchant.city || merchant.ownerName || merchant.contactName || "No additional details"}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{merchant.status || "UNKNOWN"}</p>
            </div>
          )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No merchants returned by the backend.</div>}
        </CardContent>
      </Card>
    </div>
  );
}