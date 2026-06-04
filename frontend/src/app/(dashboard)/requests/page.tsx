"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { useProducts } from "@/src/features/products";
import { createAssetRequest, listAssetRequests } from "@/src/lib/assetRequestClient";
import { getApiErrorMessage } from "@/src/services/http/client";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useAuthorization } from "@/src/hooks/useAuthorization";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const { activeSpaceId, activeSpace } = useCurrentSpace();
  const { user } = useAuth();
  const authz = useAuthorization();
  const canCreateRequest = authz.can(BACKEND_PERMISSIONS.CREATE_ASSET_REQUEST);
  const canViewRequest = authz.can(BACKEND_PERMISSIONS.VIEW_ASSET_REQUEST);
  const { data: products = [] } = useProducts();
  const [productId, setProductId] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("1");
  const [businessJustification, setBusinessJustification] = useState("");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const currentUserId = user?.id || user?._id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["asset-requests", "mine", activeSpaceId, currentUserId],
    queryFn: () => listAssetRequests({ spaceId: activeSpaceId ?? undefined, employeeId: currentUserId, page: 1, limit: 25 }),
    enabled: Boolean(activeSpaceId && currentUserId),
  });

  const requests = getItems(data);

  const createMutation = useMutation({
    mutationFn: () =>
      createAssetRequest(
        {
          requestType: activeSpace?.type === "MERCHANT" ? "MERCHANT_ASSET" : "EMPLOYEE_ASSET",
          productId,
          requestedQuantity: Number(requestedQuantity),
          businessJustification,
        },
        activeSpaceId ?? undefined,
      ),
    onSuccess: async () => {
      setProductId("");
      setRequestedQuantity("1");
      setBusinessJustification("");
      setRequestMessage("Request submitted.");
      await queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
    },
    onError: (error) => setRequestMessage(getApiErrorMessage(error)),
  });

  const visibleProducts = useMemo(() => products as Array<{ _id?: string; id?: string; name?: string; sku?: string }>, [products]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Requests"
        title="Request operations"
        description="Track employee and merchant requests through a single business workflow with role-specific approval paths."
      />

      {canCreateRequest ? (
      <Card>
        <CardHeader>
          <CardTitle>Create request</CardTitle>
          <CardDescription>{activeSpaceId ? "Submit a request in the active space." : "Select a space in the header first."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="request-product">Product</Label>
            <Select id="request-product" value={productId} onChange={(event) => setProductId(event.target.value)} disabled={!activeSpaceId || createMutation.isPending}>
              <option value="">Select product</option>
              {visibleProducts.map((product) => {
                const id = product._id || product.id;
                if (!id) return null;
                return <option key={id} value={id}>{product.name || "Unnamed product"}{product.sku ? ` (${product.sku})` : ""}</option>;
              })}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-quantity">Quantity</Label>
            <Input id="request-quantity" type="number" min={1} value={requestedQuantity} onChange={(event) => setRequestedQuantity(event.target.value)} disabled={!activeSpaceId || createMutation.isPending} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="request-justification">Business justification</Label>
            <Input id="request-justification" value={businessJustification} onChange={(event) => setBusinessJustification(event.target.value)} disabled={!activeSpaceId || createMutation.isPending} placeholder="Why do you need this asset?" />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={!activeSpaceId || !productId || !businessJustification.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Submitting..." : "Submit request"}
            </Button>
            {requestMessage ? <p className="text-sm text-slate-600">{requestMessage}</p> : null}
          </div>
        </CardContent>
      </Card>
      ) : null}

      {canViewRequest ? (
      <Card>
        <CardHeader>
          <CardTitle>Request list</CardTitle>
          <CardDescription>Real requests loaded from the backend for the selected space.</CardDescription>
        </CardHeader>
        <CardContent>
          {!activeSpaceId ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to load requests.</div>
          ) : isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Requests could not be loaded right now.</div>
          ) : requests.length ? (
            <div className="grid gap-3">
              {(requests as Array<{ _id?: string; id?: string; status?: string; productId?: { name?: string; sku?: string } | string; requestedQuantity?: number; businessJustification?: string; remarks?: string; employeeId?: { firstName?: string; lastName?: string } | string }>).map((request) => (
                <div key={request._id || request.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{typeof request.productId === "string" ? request.productId : request.productId?.name || "Request"}</p>
                      <p className="text-sm text-slate-600">Quantity: {request.requestedQuantity ?? 0}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{request.status || "PENDING"}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{request.businessJustification || request.remarks || "No justification provided."}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No requests found in this space yet.</div>
          )}
        </CardContent>
      </Card>
      ) : null}
    </div>
  );
}
