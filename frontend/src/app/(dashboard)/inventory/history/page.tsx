"use client";

import { getApiItems } from "@/src/lib/api-data";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listInventoryTransactions } from "@/src/lib/inventoryTransactionClient";

const getItems = getApiItems;

type Entity = {
  name?: string;
  code?: string;
  sku?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  merchantCode?: string;
  contactName?: string;
};

type Transaction = {
  _id?: string;
  id?: string;
  transactionType?: string;
  quantity?: number;
  remarks?: string;
  previousStatus?: string;
  newStatus?: string;
  transactionDate?: string;
  createdAt?: string;
  productId?: Entity | string;
  inventoryItemId?: { assetTag?: string; serialNumber?: string } | string | null;
  fromWarehouseId?: Entity | string | null;
  toWarehouseId?: Entity | string | null;
  fromUserId?: Entity | string | null;
  toUserId?: Entity | string | null;
  fromMerchantId?: Entity | string | null;
  toMerchantId?: Entity | string | null;
  performedBy?: Entity | string | null;
  requestId?: { requestNumber?: string; requestType?: string } | string | null;
};

function readable(value?: string | null) {
  return value ? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
}

function entityLabel(entity?: Entity | string | null) {
  if (!entity) return "";
  if (typeof entity === "string") return entity;

  const personName = [entity.firstName, entity.lastName].filter(Boolean).join(" ");
  return entity.name || personName || entity.contactName || entity.code || entity.sku || entity.employeeId || entity.merchantCode || entity.email || "";
}

function transactionTitle(entry: Transaction) {
  const product = entityLabel(entry.productId);
  const type = readable(entry.transactionType) || "Transaction";
  return product ? `${type} · ${product}` : type;
}

function transactionSubject(entry: Transaction) {
  if (entry.inventoryItemId && typeof entry.inventoryItemId === "object") {
    return entry.inventoryItemId.assetTag || entry.inventoryItemId.serialNumber || "";
  }

  return [
    entityLabel(entry.fromWarehouseId),
    entityLabel(entry.toWarehouseId),
    entityLabel(entry.fromUserId),
    entityLabel(entry.toUserId),
    entityLabel(entry.fromMerchantId),
    entityLabel(entry.toMerchantId),
  ].filter(Boolean).join(" → ");
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InventoryHistoryPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({ queryKey: ["inventory-history", activeSpaceId], queryFn: () => listInventoryTransactions({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }) });
  const transactions = getItems(data) as Transaction[];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Inventory" title="History" description="A chronological record of inventory transactions." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view history.</div>
          ) : isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">History could not be loaded.</div>
          ) : transactions.length ? (
            transactions.map((entry) => {
              const subject = transactionSubject(entry);
              const date = formatDate(entry.transactionDate || entry.createdAt);
              const actor = entityLabel(entry.performedBy);
              const statusChange = [readable(entry.previousStatus), readable(entry.newStatus)].filter(Boolean).join(" → ");

              return (
                <div key={entry._id || entry.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{transactionTitle(entry)}</p>
                      <p className="text-sm text-slate-600">
                        {subject || "Inventory movement"} · Qty {entry.quantity ?? 1}
                      </p>
                    </div>
                    {date ? <p className="text-sm text-slate-500">{date}</p> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {statusChange ? <span>Status: {statusChange}</span> : null}
                    {actor ? <span>By: {actor}</span> : null}
                    {entry.requestId && typeof entry.requestId === "object" && entry.requestId.requestNumber ? <span>Request: {entry.requestId.requestNumber}</span> : null}
                  </div>
                  {entry.remarks ? <p className="mt-2 text-sm text-slate-600">{entry.remarks}</p> : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No history records found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
