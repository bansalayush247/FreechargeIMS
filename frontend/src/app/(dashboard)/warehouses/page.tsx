"use client";

import { PageHeader } from "@/src/components/layout/page-header";
import { WarehouseTable } from "@/src/features/warehouses/components/warehouse-table";
import { useWarehouses } from "@/src/features/warehouses/hooks/use-warehouses";

export default function WarehousesPage() {
  const { data = [], isLoading, isError } = useWarehouses();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Inventory" title="Warehouses" description="Warehouses and storage locations provide the physical capacity behind inventory allocation and fulfillment." />
      {isLoading ? <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-600">Loading warehouses...</div> : isError ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Warehouses could not be loaded.</div> : <WarehouseTable warehouses={data} />}
    </div>
  );
}