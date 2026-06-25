"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getApiItems } from "@/src/lib/api-data";
import { listInventoryTransactions } from "@/src/lib/inventoryTransactionClient";

type Entity = {
  name?: string;
  code?: string;
  sku?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  merchantCode?: string;
};

type ReturnTransaction = {
  _id?: string;
  id?: string;
  quantity?: number;
  remarks?: string;
  previousStatus?: string;
  newStatus?: string;
  transactionDate?: string;
  createdAt?: string;
  productId?: Entity | string;
  inventoryItemId?: { assetTag?: string; serialNumber?: string } | string | null;
  fromUserId?: Entity | string | null;
  fromMerchantId?: Entity | string | null;
  toWarehouseId?: Entity | string | null;
  performedBy?: Entity | string | null;
};

function readable(value?: string | null) {
  return value ? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
}

function entityLabel(entity?: Entity | string | null) {
  if (!entity) return "";
  if (typeof entity === "string") return entity;

  const personName = [entity.firstName, entity.lastName].filter(Boolean).join(" ");
  return entity.name || entity.code || entity.sku || personName || entity.employeeId || entity.merchantCode || entity.email || "";
}

function assetLabel(entry: ReturnTransaction) {
  if (entry.inventoryItemId && typeof entry.inventoryItemId === "object") {
    return entry.inventoryItemId.assetTag || entry.inventoryItemId.serialNumber || "";
  }

  return entityLabel(entry.productId) || "Inventory item";
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InventoryReturnsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventory-returns", activeSpaceId],
    queryFn: () => listInventoryTransactions({ spaceId: activeSpaceId ?? undefined, transactionType: "RETURN", page: 1, limit: 50 }),
    enabled: Boolean(activeSpaceId),
  });
  const returns = getApiItems<ReturnTransaction>(data);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Inventory" title="Returns" description="Capture returned assets and inspect their state." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view returns.</div>
          ) : isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Returns could not be loaded.</div>
          ) : returns.length ? (
            returns.map((entry) => {
              const date = formatDate(entry.transactionDate || entry.createdAt);
              const returnedFrom = entityLabel(entry.fromUserId) || entityLabel(entry.fromMerchantId) || "Assignee";
              const statusChange = [readable(entry.previousStatus), readable(entry.newStatus)].filter(Boolean).join(" → ");

              return (
                <div key={entry._id || entry.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{assetLabel(entry)}</p>
                      <p className="text-sm text-slate-600">
                        Returned from {returnedFrom} to {entityLabel(entry.toWarehouseId) || "inventory"} · Qty {entry.quantity ?? 1}
                      </p>
                    </div>
                    {date ? <p className="text-sm text-slate-500">{date}</p> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {statusChange ? <span>Status: {statusChange}</span> : null}
                    {entityLabel(entry.performedBy) ? <span>By: {entityLabel(entry.performedBy)}</span> : null}
                  </div>
                  {entry.remarks ? <p className="mt-2 text-sm text-slate-600">{entry.remarks}</p> : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No return records found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
