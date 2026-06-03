"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getInventoryItem } from "@/src/lib/inventoryClient";
import { getInventoryItemAuditTrail } from "@/src/lib/inventoryTransactionClient";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function InventoryItemPage() {
  const params = useParams<{ id: string }>();
  const { activeSpaceId } = useCurrentSpace();
  const id = params.id;
  const { data: itemData, isLoading, isError } = useQuery({ queryKey: ["inventory-item", id, activeSpaceId], queryFn: () => getInventoryItem(id, activeSpaceId ?? undefined), enabled: Boolean(id) });
  const { data: auditData } = useQuery({ queryKey: ["inventory-item-audit", id, activeSpaceId], queryFn: () => getInventoryItemAuditTrail(id, activeSpaceId ?? undefined), enabled: Boolean(id) });
  const item = itemData && typeof itemData === "object" && "data" in itemData ? (itemData as { data?: Record<string, unknown> }).data : itemData;
  const auditTrail = getItems(auditData) as Array<{ _id?: string; id?: string; action?: string; notes?: string; createdAt?: string }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Inventory" title={`Asset ${id}`} description="Live asset detail and audit trail." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader><CardTitle>Asset information</CardTitle><CardDescription>Current asset fields returned by the backend.</CardDescription></CardHeader>
          <CardContent>{!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load asset details.</div> : isLoading ? <Skeleton className="h-32 w-full" /> : isError || !item || typeof item !== "object" ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Asset could not be loaded.</div> : <div className="grid gap-4 md:grid-cols-2"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Asset tag</p><p className="mt-1 font-medium text-slate-900">{String((item as { assetTag?: string }).assetTag || "-")}</p></div><div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Serial number</p><p className="mt-1 font-medium text-slate-900">{String((item as { serialNumber?: string }).serialNumber || "-")}</p></div><div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</p><p className="mt-1 font-medium text-slate-900">{String((item as { status?: string }).status || "UNKNOWN")}</p></div><div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Quantity</p><p className="mt-1 font-medium text-slate-900">{String((item as { quantity?: number }).quantity ?? 0)}</p></div></div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Audit trail</CardTitle><CardDescription>Recent inventory transactions for this asset.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{auditTrail.length ? auditTrail.map((entry) => <div key={entry._id || entry.id} className="rounded-2xl border border-orange-100 bg-white p-4"><p className="font-medium text-slate-900">{entry.action || "Transaction"}</p><p className="text-sm text-slate-600">{entry.notes || entry.createdAt || "No notes"}</p></div>) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No audit trail items found.</div>}</CardContent>
        </Card>
      </div>
    </div>
  );
}