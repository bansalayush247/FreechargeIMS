"use client";

import { getApiItems } from "@/src/lib/api-data";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listInventoryTransactions } from "@/src/lib/inventoryTransactionClient";

const getItems = getApiItems;

export default function InventoryTransfersPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({ queryKey: ["inventory-transfers", activeSpaceId], queryFn: () => listInventoryTransactions({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }) });
  const transactions = getItems(data) as Array<{ _id?: string; id?: string; type?: string; action?: string; notes?: string; createdAt?: string }>;
  const transfers = transactions.filter((entry) => /transfer/i.test(`${entry.type || ""} ${entry.action || ""} ${entry.notes || ""}`));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Inventory" title="Transfers" description="Asset movement between users, spaces, or warehouses." />
      <Card><CardContent className="space-y-3 p-6">{!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view transfers.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Transfers could not be loaded.</div> : transfers.length ? transfers.map((entry) => <div key={entry._id || entry.id} className="rounded-2xl border border-orange-100 bg-white p-4"><p className="font-medium text-slate-900">{entry.action || entry.type || "Transfer"}</p><p className="text-sm text-slate-600">{entry.notes || entry.createdAt || "No details"}</p></div>) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No transfer records found.</div>}</CardContent></Card>
    </div>
  );
}