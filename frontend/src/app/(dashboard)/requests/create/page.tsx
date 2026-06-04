"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { useProducts } from "@/src/features/products";
import { createAssetRequest } from "@/src/lib/assetRequestClient";
import { listMerchants } from "@/src/lib/merchantClient";
import { getApiErrorMessage } from "@/src/services/http/client";

export default function CreateRequestPage() {
  const queryClient = useQueryClient();
  const { activeSpaceId, activeSpace } = useCurrentSpace();
  const { data: products = [] } = useProducts();
  const requestType = activeSpace?.type === "MERCHANT" ? "MERCHANT_ASSET" : "EMPLOYEE_ASSET";
  const isMerchantRequest = requestType === "MERCHANT_ASSET";
  const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ["request-merchants", activeSpaceId],
    queryFn: () => listMerchants({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 100 }),
    enabled: Boolean(activeSpaceId && isMerchantRequest),
  });
  const [productId, setProductId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("1");
  const [businessJustification, setBusinessJustification] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createAssetRequest(
        {
          requestType,
          merchantId: isMerchantRequest ? merchantId : undefined,
          productId,
          requestedQuantity: Number(requestedQuantity),
          businessJustification,
        },
        activeSpaceId ?? undefined,
      ),
    onSuccess: async () => {
      setProductId("");
      setMerchantId("");
      setRequestedQuantity("1");
      setBusinessJustification("");
      setMessage("Request submitted.");
      await queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Requests" title="Create request" description="Submit a real request into the backend workflow for the active space." />
      <Card>
        <CardHeader>
          <CardTitle>New asset request</CardTitle>
          <CardDescription>
            {activeSpaceId
              ? `Choose a product and submit. This will create a ${requestType === "MERCHANT_ASSET" ? "merchant" : "employee"} request.`
              : "Select a space first."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
            <Select id="productId" value={productId} onChange={(event) => setProductId(event.target.value)} disabled={!activeSpaceId || createMutation.isPending}>
              <option value="">Select product</option>
              {(products as Array<{ _id?: string; id?: string; name?: string; sku?: string }>).map((product) => {
                const id = product._id || product.id;
                if (!id) return null;
                return <option key={id} value={id}>{product.name || "Unnamed product"}{product.sku ? ` (${product.sku})` : ""}</option>;
              })}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestedQuantity">Quantity</Label>
            <Input id="requestedQuantity" type="number" min={1} value={requestedQuantity} onChange={(event) => setRequestedQuantity(event.target.value)} disabled={!activeSpaceId || createMutation.isPending} />
          </div>
          {isMerchantRequest ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="merchantId">Merchant</Label>
              <Select id="merchantId" value={merchantId} onChange={(event) => setMerchantId(event.target.value)} disabled={!activeSpaceId || merchantsLoading || createMutation.isPending}>
                <option value="">{merchantsLoading ? "Loading merchants..." : "Select merchant"}</option>
                {(merchants as Array<{ _id?: string; id?: string; name?: string; merchantCode?: string }>).map((merchant) => {
                  const id = merchant._id || merchant.id;
                  if (!id) return null;
                  return <option key={id} value={id}>{merchant.name || "Unnamed merchant"}{merchant.merchantCode ? ` (${merchant.merchantCode})` : ""}</option>;
                })}
              </Select>
            </div>
          ) : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="businessJustification">Business justification</Label>
            <Input id="businessJustification" value={businessJustification} onChange={(event) => setBusinessJustification(event.target.value)} disabled={!activeSpaceId || createMutation.isPending} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={!activeSpaceId || !productId || (isMerchantRequest && !merchantId) || !businessJustification.trim() || createMutation.isPending}>{createMutation.isPending ? "Submitting..." : "Submit request"}</Button>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
