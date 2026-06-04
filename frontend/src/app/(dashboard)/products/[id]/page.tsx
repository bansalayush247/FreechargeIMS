"use client";

import { getApiItems } from "@/src/lib/api-data";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Boxes, ClipboardList, History } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getProduct } from "@/src/features/products/api";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listAssetRequests } from "@/src/lib/assetRequestClient";
import { listInventory } from "@/src/lib/inventoryClient";
import { listInventoryTransactions } from "@/src/lib/inventoryTransactionClient";

const getItems = getApiItems;

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Unknown date";
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeSpaceId } = useCurrentSpace();
  const productQuery = useQuery({ queryKey: ["product", id, activeSpaceId], queryFn: () => getProduct(id), enabled: Boolean(id && activeSpaceId) });
  const inventoryQuery = useQuery({ queryKey: ["product-lifecycle", "inventory", activeSpaceId, id], queryFn: () => listInventory({ spaceId: activeSpaceId ?? undefined, productId: id, page: 1, limit: 100 }), enabled: Boolean(id && activeSpaceId) });
  const requestsQuery = useQuery({ queryKey: ["product-lifecycle", "requests", activeSpaceId, id], queryFn: () => listAssetRequests({ spaceId: activeSpaceId ?? undefined, productId: id, page: 1, limit: 100 }), enabled: Boolean(id && activeSpaceId) });
  const transactionsQuery = useQuery({ queryKey: ["product-lifecycle", "transactions", activeSpaceId, id], queryFn: () => listInventoryTransactions({ spaceId: activeSpaceId ?? undefined, productId: id, page: 1, limit: 100 }), enabled: Boolean(id && activeSpaceId) });

  const product = productQuery.data as { name?: string; sku?: string; category?: string; brand?: string; model?: string; assetType?: string; trackingType?: string; minimumStock?: number; createdAt?: string } | undefined;
  const assets = getItems(inventoryQuery.data) as Array<{ _id?: string; id?: string; assetTag?: string; serialNumber?: string; status?: string; quantity?: number; warehouseId?: { name?: string } }>;
  const requests = getItems(requestsQuery.data) as Array<{ _id?: string; id?: string; requestNumber?: string; requestType?: string; status?: string; requestedQuantity?: number; createdAt?: string }>;
  const transactions = getItems(transactionsQuery.data) as Array<{ _id?: string; id?: string; transactionType?: string; previousStatus?: string; newStatus?: string; transactionDate?: string; inventoryItemId?: { assetTag?: string; serialNumber?: string } }>;
  const isLoading = productQuery.isLoading || inventoryQuery.isLoading || requestsQuery.isLoading || transactionsQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product lifecycle"
        title={product?.name || "Product"}
        description="Catalog identity, physical assets, requests, and inventory movement in the active space."
        actions={<Link href="/products" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" />Products</Link>}
      />
      {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view this product lifecycle.</div> : isLoading ? <Skeleton className="h-96 w-full" /> : productQuery.isError || !product ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Product could not be loaded.</div> : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-5"><Boxes className="h-5 w-5 text-orange-500" /><p className="mt-3 text-2xl font-semibold text-slate-900">{assets.length}</p><p className="text-sm text-slate-600">Physical inventory records</p></CardContent></Card>
            <Card><CardContent className="p-5"><ClipboardList className="h-5 w-5 text-orange-500" /><p className="mt-3 text-2xl font-semibold text-slate-900">{requests.length}</p><p className="text-sm text-slate-600">Asset requests</p></CardContent></Card>
            <Card><CardContent className="p-5"><History className="h-5 w-5 text-orange-500" /><p className="mt-3 text-2xl font-semibold text-slate-900">{transactions.length}</p><p className="text-sm text-slate-600">Inventory movements</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Catalog identity</CardTitle><CardDescription>What this product represents.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-3">
              {[["SKU", product.sku], ["Category", product.category], ["Brand", product.brand], ["Model", product.model], ["Asset type", product.assetType], ["Tracking", product.trackingType], ["Minimum stock", String(product.minimumStock ?? 0)], ["Created", formatDate(product.createdAt)]].map(([label, value]) => <div key={label}><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-900">{value || "-"}</p></div>)}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Physical assets</CardTitle><CardDescription>Current inventory items created from this product.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {assets.length ? assets.map((asset) => <div key={asset._id || asset.id} className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 p-4"><div><p className="font-medium text-slate-900">{asset.assetTag || asset.serialNumber || "Inventory item"}</p><p className="text-sm text-slate-600">{asset.warehouseId?.name || "No warehouse"} · Qty {asset.quantity ?? 0}</p><Badge variant="secondary" className="mt-2">{asset.status || "UNKNOWN"}</Badge></div><Link href={`/inventory/assets/${asset._id || asset.id}`} className={buttonVariants({ size: "icon", variant: "outline" })} title="Open asset lifecycle"><ArrowRight className="h-4 w-4" /></Link></div>) : <p className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No physical assets for this product in the active space.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Requests</CardTitle><CardDescription>Demand and fulfillment activity for this product.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {requests.length ? requests.map((request) => <div key={request._id || request.id} className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 p-4"><div><p className="font-medium text-slate-900">{request.requestNumber || "Asset request"}</p><p className="text-sm text-slate-600">{request.requestType || "Request"} · Qty {request.requestedQuantity ?? 0}</p><Badge variant="secondary" className="mt-2">{request.status || "UNKNOWN"}</Badge></div><Link href={`/requests/${request._id || request.id}`} className={buttonVariants({ size: "icon", variant: "outline" })} title="Open request"><ArrowRight className="h-4 w-4" /></Link></div>) : <p className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No requests for this product in the active space.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Movement timeline</CardTitle><CardDescription>Chronological inventory transactions for this product.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {transactions.length ? transactions.map((transaction) => <div key={transaction._id || transaction.id} className="flex items-center justify-between gap-4 border-b border-orange-100 py-3 last:border-0"><div><p className="font-medium text-slate-900">{transaction.transactionType || "Inventory movement"}</p><p className="text-sm text-slate-600">{transaction.inventoryItemId?.assetTag || transaction.inventoryItemId?.serialNumber || "Inventory item"} · {transaction.previousStatus || "-"} → {transaction.newStatus || "-"}</p><p className="text-xs text-slate-500">{formatDate(transaction.transactionDate)}</p></div><Link href={`/transactions/${transaction._id || transaction.id}`} className={buttonVariants({ size: "icon", variant: "outline" })} title="Open transaction"><ArrowRight className="h-4 w-4" /></Link></div>) : <p className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No inventory movements recorded for this product.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
