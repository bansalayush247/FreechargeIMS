"use client";

import { useMemo } from "react";
import { PageHeader } from "@/src/components/layout/page-header";
import { Skeleton } from "@/src/components/ui/skeleton";
import { WarehouseTable, useWarehouses } from "@/src/features/warehouses";

export default function StorageLocationsPage() {
  const { data = [], isLoading, isError } = useWarehouses();
  const items = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Storage locations"
        title="Storage locations network"
        description="Track storage locations (warehouses) through a shared table abstraction and a predictable query layer."
      />

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          Unable to load storage locations right now.
        </div>
      ) : (
        <WarehouseTable warehouses={items} />
      )}
    </div>
  );
}
