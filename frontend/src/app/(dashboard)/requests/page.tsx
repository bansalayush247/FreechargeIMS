"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { createAssetRequest, listAssetRequests } from "@/src/lib/assetRequestClient";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getProducts } from "@/src/features/products/api";

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const [productId, setProductId] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("1");
  const [businessJustification, setBusinessJustification] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeSpaceId, "request-form"],
    queryFn: () => getProducts(activeSpaceId || undefined),
    enabled: Boolean(activeSpaceId),
  });

  const { data: requestsData } = useQuery({
    queryKey: ["asset-requests", activeSpaceId],
    queryFn: () => listAssetRequests({ spaceId: activeSpaceId || undefined, page: 1, limit: 20 }),
    enabled: Boolean(activeSpaceId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAssetRequest(
        {
          productId,
          requestedQuantity: Number(requestedQuantity),
          businessJustification,
        },
        activeSpaceId || undefined,
      ),
    onSuccess: () => {
      setBusinessJustification("");
      setRequestedQuantity("1");
      queryClient.invalidateQueries({ queryKey: ["asset-requests", activeSpaceId] });
    },
  });

  const requests = requestsData?.data?.items ?? requestsData?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Requests"
        title="Product Requests"
        description="Raise product requests in your currently selected space."
      />

      {!activeSpaceId ? (
        <div className="rounded-xl border p-4 text-sm">Select a space from the header first.</div>
      ) : (
        <div className="grid gap-4 rounded-xl border p-4">
          <div className="space-y-2">
            <Label htmlFor="request-product">Product</Label>
            <Select id="request-product" value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">Select product</option>
              {products.map((product: { _id?: string; id?: string; name?: string; sku?: string }) => {
                const id = product._id || product.id;
                if (!id) return null;
                return (
                  <option key={id} value={id}>
                    {product.name || "Unnamed"} ({product.sku || "NA"})
                  </option>
                );
              })}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-qty">Quantity</Label>
            <Input id="request-qty" value={requestedQuantity} onChange={(event) => setRequestedQuantity(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-justification">Business justification</Label>
            <Input id="request-justification" value={businessJustification} onChange={(event) => setBusinessJustification(event.target.value)} />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!productId || !businessJustification.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Submitting..." : "Request product"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">My Recent Requests</h2>
        {requests.length ? (
          requests.map((request: { _id?: string; id?: string; status?: string; productId?: { name?: string; sku?: string }; requestedQuantity?: number }) => (
            <div key={request._id || request.id} className="rounded-xl border p-3 text-sm">
              {(request.productId?.name || "Product")} x {request.requestedQuantity ?? 1} - {request.status || "pending"}
            </div>
          ))
        ) : (
          <div className="rounded-xl border p-3 text-sm">No requests yet.</div>
        )}
      </div>
    </div>
  );
}
