"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  Building2,
  CalendarClock,
  CircleUserRound,
  ClipboardList,
  MapPin,
  PackageCheck,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useToast } from "@/src/components/toastProvider";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getApiItems } from "@/src/lib/api-data";
import { getInventoryItem } from "@/src/lib/inventoryClient";
import { createInventoryTransaction, getInventoryItemAuditTrail } from "@/src/lib/inventoryTransactionClient";
import { getApiErrorMessage } from "@/src/services/http/client";

type Entity = {
  _id?: string;
  id?: string;
  name?: string;
  code?: string;
  sku?: string;
  merchantCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  requestNumber?: string;
};

type InventoryItem = {
  _id?: string;
  id?: string;
  assetTag?: string;
  serialNumber?: string;
  status?: string;
  condition?: string;
  quantity?: number;
  remarks?: string;
  createdAt?: string;
  assignedAt?: string;
  productId?: Entity;
  warehouseId?: Entity;
  assignedUserId?: Entity;
  assignedMerchantId?: Entity;
  createdBy?: Entity;
};

type InventoryTransaction = {
  _id?: string;
  id?: string;
  transactionType?: string;
  quantity?: number;
  remarks?: string;
  previousStatus?: string;
  newStatus?: string;
  transactionDate?: string;
  performedBy?: Entity;
  fromWarehouseId?: Entity;
  toWarehouseId?: Entity;
  fromUserId?: Entity;
  toUserId?: Entity;
  fromMerchantId?: Entity;
  toMerchantId?: Entity;
  requestId?: Entity;
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Unknown date";
}

function entityLabel(entity?: Entity | null) {
  if (!entity) return "";
  const personName = [entity.firstName, entity.lastName].filter(Boolean).join(" ");
  return personName || entity.name || entity.requestNumber || entity.email || entity.employeeId || entity.merchantCode || entity.code || "";
}

function readable(value?: string) {
  return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return <div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-900">{value ?? "-"}</p></div>;
}

export default function InventoryItemPage() {
  const { id } = useParams<{ id: string }>();
  const { activeSpaceId } = useCurrentSpace();
  const queryClient = useQueryClient();
  const toast = useToast();
  const itemQuery = useQuery({
    queryKey: ["inventory-item", id, activeSpaceId],
    queryFn: () => getInventoryItem(id, activeSpaceId ?? undefined),
    enabled: Boolean(id && activeSpaceId),
  });
  const auditQuery = useQuery({
    queryKey: ["inventory-item-audit", id, activeSpaceId],
    queryFn: () => getInventoryItemAuditTrail(id, activeSpaceId ?? undefined),
    enabled: Boolean(id && activeSpaceId),
  });

  const itemPayload = itemQuery.data && typeof itemQuery.data === "object" && "data" in itemQuery.data
    ? (itemQuery.data as { data?: InventoryItem }).data
    : itemQuery.data;
  const item = itemPayload as InventoryItem | undefined;
  const auditTrail = getApiItems<InventoryTransaction>(auditQuery.data);
  const currentAssignee = entityLabel(item?.assignedUserId) || entityLabel(item?.assignedMerchantId);
  const repairMutation = useMutation({
    mutationFn: ({ transactionType, remarks }: { transactionType: string; remarks: string }) =>
      createInventoryTransaction(
        {
          inventoryItemId: id,
          transactionType,
          remarks,
        },
        activeSpaceId ?? undefined,
      ),
    onSuccess: async () => {
      toast.show("success", "Repair status updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-item", id, activeSpaceId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-item-audit", id, activeSpaceId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-history", activeSpaceId] }),
      ]);
    },
    onError: (error) => {
      toast.show("error", getApiErrorMessage(error));
    },
  });

  const runRepairAction = (transactionType: string, remarks: string) => {
    repairMutation.mutate({ transactionType, remarks });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asset lifecycle"
        title={item?.assetTag || item?.serialNumber || "Inventory asset"}
        description="Current ownership, location, and chronological movement history for this physical asset."
      />

      {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load asset details.</div> : itemQuery.isLoading ? <Skeleton className="h-80 w-full" /> : itemQuery.isError || !item ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Asset could not be loaded.</div> : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-5"><Boxes className="h-5 w-5 text-orange-500" /><p className="mt-3 font-semibold text-slate-900">{entityLabel(item.productId) || "Unknown product"}</p><p className="text-sm text-slate-600">{item.productId?.sku || "No SKU"}</p></CardContent></Card>
            <Card><CardContent className="p-5"><MapPin className="h-5 w-5 text-orange-500" /><p className="mt-3 font-semibold text-slate-900">{entityLabel(item.warehouseId) || "No warehouse"}</p><p className="text-sm text-slate-600">{item.warehouseId?.code || "Current location"}</p></CardContent></Card>
            <Card><CardContent className="p-5"><UserRoundCheck className="h-5 w-5 text-orange-500" /><p className="mt-3 font-semibold text-slate-900">{currentAssignee || "Unassigned"}</p><p className="text-sm text-slate-600">{currentAssignee ? `Assigned ${formatDate(item.assignedAt)}` : "Available inventory"}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Asset information</CardTitle><CardDescription>Identity and current state of this inventory record.</CardDescription></CardHeader>
            <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Asset tag" value={item.assetTag} />
              <Detail label="Serial number" value={item.serialNumber} />
              <Detail label="Status" value={readable(item.status)} />
              <Detail label="Condition" value={readable(item.condition)} />
              <Detail label="Quantity" value={item.quantity ?? 0} />
              <Detail label="Created by" value={entityLabel(item.createdBy)} />
              <Detail label="Created" value={formatDate(item.createdAt)} />
              <Detail label="Remarks" value={item.remarks || "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repair actions</CardTitle>
              <CardDescription>Track a lightweight repair lifecycle through inventory transactions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => runRepairAction("SEND_TO_REPAIR", "Asset sent to repair")}
                disabled={repairMutation.isPending || item.status === "UNDER_REPAIR"}
              >
                <Wrench className="h-4 w-4" />
                Send to repair
              </Button>
              <Button
                variant="outline"
                onClick={() => runRepairAction("REPAIR_RETURN", "Asset returned from repair")}
                disabled={repairMutation.isPending || item.status !== "UNDER_REPAIR"}
              >
                Mark repaired
              </Button>
              <Button
                variant="outline"
                onClick={() => runRepairAction("REPAIR_FAILED", "Repair failed")}
                disabled={repairMutation.isPending || item.status !== "UNDER_REPAIR"}
              >
                Repair failed
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Audit trail</CardTitle><CardDescription>Oldest to newest. Each event records who moved the asset, where it went, and why.</CardDescription></CardHeader>
            <CardContent>
              {auditQuery.isLoading ? <Skeleton className="h-52 w-full" /> : auditQuery.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Audit trail could not be loaded.</div> : (
                <div className="relative space-y-0 pl-8 before:absolute before:bottom-5 before:left-[11px] before:top-5 before:w-px before:bg-orange-200">
                  {auditTrail.length ? auditTrail.map((entry) => {
                    const recipient = entityLabel(entry.toUserId) || entityLabel(entry.toMerchantId);
                    const sender = entityLabel(entry.fromUserId) || entityLabel(entry.fromMerchantId);
                    const destination = entityLabel(entry.toWarehouseId);
                    const source = entityLabel(entry.fromWarehouseId);

                    return (
                      <div key={entry._id || entry.id} className="relative pb-6">
                        <div className="absolute -left-8 top-5 flex h-6 w-6 items-center justify-center rounded-full border border-orange-200 bg-white"><PackageCheck className="h-3.5 w-3.5 text-orange-600" /></div>
                        <div className="rounded-2xl border border-orange-100 bg-white p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div><p className="font-semibold text-slate-900">{readable(entry.transactionType)}</p><p className="mt-1 text-xs text-slate-500">{formatDate(entry.transactionDate)}</p></div>
                            <Badge variant="secondary">{readable(entry.previousStatus)} to {readable(entry.newStatus)}</Badge>
                          </div>
                          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            <p className="flex items-start gap-2 text-slate-600"><CircleUserRound className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /><span><span className="block text-xs text-slate-500">Performed by</span>{entityLabel(entry.performedBy) || "Unknown user"}</span></p>
                            {recipient ? <p className="flex items-start gap-2 text-slate-600"><UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /><span><span className="block text-xs text-slate-500">Assigned to</span>{recipient}</span></p> : null}
                            {sender ? <p className="flex items-start gap-2 text-slate-600"><CircleUserRound className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /><span><span className="block text-xs text-slate-500">Returned / moved from</span>{sender}</span></p> : null}
                            {source || destination ? <p className="flex items-start gap-2 text-slate-600"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /><span><span className="block text-xs text-slate-500">Location</span>{source || "External"} to {destination || "Assignee"}</span></p> : null}
                            <p className="flex items-start gap-2 text-slate-600"><Boxes className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /><span><span className="block text-xs text-slate-500">Quantity</span>{entry.quantity ?? 1}</span></p>
                            {entry.requestId ? <p className="flex items-start gap-2 text-slate-600"><ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /><span><span className="block text-xs text-slate-500">Request</span>{entityLabel(entry.requestId)}</span></p> : null}
                          </div>
                          {entry.remarks ? <p className="mt-4 border-t border-orange-100 pt-3 text-sm text-slate-600">{entry.remarks}</p> : null}
                          <div className="mt-4 flex justify-end"><Link href={`/transactions/${entry._id || entry.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Transaction details<ArrowRight className="h-4 w-4" /></Link></div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="relative pb-2">
                      <div className="absolute -left-8 top-5 flex h-6 w-6 items-center justify-center rounded-full border border-orange-200 bg-white"><CalendarClock className="h-3.5 w-3.5 text-orange-600" /></div>
                      <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5">
                        <p className="font-semibold text-slate-900">Asset record created</p>
                        <p className="mt-1 text-sm text-slate-600">Created by {entityLabel(item.createdBy) || "an unknown user"} in {entityLabel(item.warehouseId) || "the current warehouse"}.</p>
                        <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                        <p className="mt-4 text-sm text-slate-600">No movement transactions have been recorded yet. New inventory creation and stock-in activity will now appear here automatically.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
