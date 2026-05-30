"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { createAssetRequest, itApproveAssetRequest, listAssetRequests, managerApproveAssetRequest, rejectAssetRequest } from "@/src/lib/assetRequestClient";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { getProducts } from "@/src/features/products/api";
import { useAuth } from "@/src/features/auth/auth-provider";
import { hasPermission } from "@/src/lib/permissions";
import { getApiErrorMessage } from "@/src/services/http/client";
import { listInventory } from "@/src/lib/inventoryClient";
import { listMembers } from "@/src/lib/spaceMemberClient";
import { getInventoryItemAuditTrail } from "@/src/lib/inventoryTransactionClient";

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const { user } = useAuth();
  const [productId, setProductId] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("1");
  const [businessJustification, setBusinessJustification] = useState("");
  const [rejectRemark, setRejectRemark] = useState("Rejected from requests page.");
  const [requestActionMessage, setRequestActionMessage] = useState<string | null>(null);
  const [selectedAuditTrailItemId, setSelectedAuditTrailItemId] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeSpaceId, "request-form"],
    queryFn: () => getProducts(),
    enabled: Boolean(activeSpaceId),
  });

  const { data: requestsData } = useQuery({
    queryKey: ["asset-requests", activeSpaceId],
    queryFn: () => listAssetRequests({ spaceId: activeSpaceId || undefined, page: 1, limit: 20 }),
    enabled: Boolean(activeSpaceId),
  });
  const { data: myRequestsData } = useQuery({
    queryKey: ["asset-requests", "mine", user?.id],
    queryFn: () => listAssetRequests({ employeeId: user?.id || undefined, page: 1, limit: 50 }),
    enabled: Boolean(user?.id),
  });
  const { data: inventoryData } = useQuery({
    queryKey: ["space-inventory", activeSpaceId, "request-form"],
    queryFn: () => listInventory({ spaceId: activeSpaceId || undefined, page: 1, limit: 50 }),
    enabled: Boolean(activeSpaceId),
  });
  const { data: members = [] } = useQuery({
    queryKey: ["space-members", activeSpaceId, "requests-page"],
    queryFn: () => listMembers(activeSpaceId || undefined),
    enabled: Boolean(activeSpaceId),
  });
  const { data: selectedAuditTrailData, isFetching: isAuditTrailLoading, error: auditTrailError } = useQuery({
    queryKey: ["inventory-audit-trail", activeSpaceId, selectedAuditTrailItemId],
    queryFn: () => getInventoryItemAuditTrail(selectedAuditTrailItemId as string, activeSpaceId || undefined),
    enabled: Boolean(activeSpaceId && selectedAuditTrailItemId),
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
  const canReviewAssetRequests =
    hasPermission(user, { action: "MANAGER_APPROVE", resource: "ASSET_REQUEST" }) ||
    hasPermission(user, { action: "IT_APPROVE", resource: "ASSET_REQUEST" }) ||
    hasPermission(user, { action: "REJECT", resource: "ASSET_REQUEST" }) ||
    String(user?.userType || "").toUpperCase() === "ADMIN";
  const canViewAllSpaceRequests = (() => {
    const isSuperAdmin = String(user?.userType || "").toUpperCase() === "ADMIN";
    if (isSuperAdmin) return true;
    return (members as Array<{ userId?: { _id?: string; id?: string }; roles?: Array<{ code?: string; name?: string }> }>).some((m) => {
      const memberUserId = m.userId?._id || m.userId?.id;
      if (!memberUserId || !user?.id || String(memberUserId) !== String(user.id)) return false;
      return (m.roles || []).some((r) => String(r.code || r.name || "").toUpperCase() === "SPACE_ADMIN");
    });
  })();
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, requestSpaceId, status }: { requestId: string; requestSpaceId?: string; status?: string }) => {
      if (String(status || "").toUpperCase() === "MANAGER_APPROVED") {
        await itApproveAssetRequest(requestId, { remarks: "IT approved from requests page." }, requestSpaceId || activeSpaceId || undefined);
        return "IT approved and fulfilled.";
      }
      await managerApproveAssetRequest(requestId, { remarks: "Approved from requests page." }, requestSpaceId || activeSpaceId || undefined);
      return "Approved and routed by space type.";
    },
    onSuccess: async (message) => {
      setRequestActionMessage(message);
      await queryClient.invalidateQueries({ queryKey: ["asset-requests", activeSpaceId] });
    },
    onError: (error) => setRequestActionMessage(getApiErrorMessage(error)),
  });
  const rejectRequestMutation = useMutation({
    mutationFn: ({ requestId, requestSpaceId }: { requestId: string; requestSpaceId?: string }) =>
      rejectAssetRequest(requestId, { rejectionReason: rejectRemark.trim() || "Rejected from requests page." }, requestSpaceId || activeSpaceId || undefined),
    onSuccess: async () => {
      setRequestActionMessage("Request rejected.");
      await queryClient.invalidateQueries({ queryKey: ["asset-requests", activeSpaceId] });
    },
    onError: (error) => setRequestActionMessage(getApiErrorMessage(error)),
  });

  const requests = requestsData?.data?.items ?? requestsData?.items ?? [];
  const myRequests = myRequestsData?.data?.items ?? myRequestsData?.items ?? [];
  const inventoryItems = inventoryData?.data?.items ?? inventoryData?.items ?? [];
  const getRefId = (value: unknown) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const record = value as { _id?: string; id?: string };
      return String(record._id || record.id || "");
    }
    return String(value);
  };
  const inventoryProductIds = new Set(
    inventoryItems
      .map((item: { productId?: unknown }) => getRefId(item.productId))
      .filter(Boolean)
  );
  const currentUserId = user?.id;
  const canViewInventoryTrail = hasPermission(user, { action: "VIEW", resource: "INVENTORY_TRANSACTION" }) || String(user?.userType || "").toUpperCase() === "ADMIN";
  const getRequestInventoryItemId = (request: { inventoryItemId?: unknown }) => getRefId(request.inventoryItemId);
  const canViewTrailForRequest = (request: { employeeId?: unknown; inventoryItemId?: unknown }) => {
    const inventoryItemId = getRequestInventoryItemId(request);
    if (!inventoryItemId) {
      return false;
    }

    const requesterId = getRefId(request.employeeId);
    return Boolean(currentUserId && requesterId === String(currentUserId)) || canViewInventoryTrail;
  };
  const visibleProducts = inventoryProductIds.size
    ? products.filter((product: { _id?: string; id?: string }) => inventoryProductIds.has(String(product._id || product.id || "")))
    : products;
  const visibleRequests = requests.filter((request: { spaceId?: { _id?: string; id?: string } | string }) => {
    const requestSpaceId = getRefId(request.spaceId);
    return !activeSpaceId || requestSpaceId === String(activeSpaceId);
  });
  const buildLifecycle = (request: {
    status?: string;
    createdAt?: string;
    managerApprovalAt?: string;
    itApprovalAt?: string;
    approvedAt?: string;
    fulfilledAt?: string;
    updatedAt?: string;
    rejectionReason?: string;
    inventoryItemId?: { _id?: string; id?: string };
  }) => {
    const items = [
      { label: "Requested", value: request.createdAt },
      { label: "Manager approved", value: request.managerApprovalAt },
      { label: "IT approved", value: request.itApprovalAt },
      { label: "Fulfilled", value: request.fulfilledAt || request.approvedAt || request.updatedAt },
    ].filter((entry) => Boolean(entry.value));

    return items;
  };
  const myVisibleRequests = myRequests.length ? myRequests : visibleRequests.filter((request: { employeeId?: { _id?: string; id?: string } | string }) => {
    const creatorId = getRefId(request.employeeId);
    return Boolean(currentUserId) && creatorId === String(currentUserId);
  });

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
              {visibleProducts.map((product: { _id?: string; id?: string; name?: string; sku?: string }) => {
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

      {canReviewAssetRequests ? (
        <div className="grid gap-2 rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-4">
          <Label htmlFor="reject-remark">Reject remark</Label>
          <Input
            id="reject-remark"
            value={rejectRemark}
            onChange={(event) => setRejectRemark(event.target.value)}
            placeholder="Add a rejection reason before clicking Reject"
          />
          <p className="text-xs text-slate-600">This remark is sent with the reject action and shown in the audit trail.</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">My Requests</h2>
        {requestActionMessage ? <div className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">{requestActionMessage}</div> : null}
        {myVisibleRequests.length ? (
          myVisibleRequests.map((request: { _id?: string; id?: string; status?: string; productId?: { name?: string; sku?: string }; requestedQuantity?: number; requestNumber?: string; createdAt?: string; businessJustification?: string; forwardedFromSpaceId?: { name?: string; code?: string }; inventoryItemId?: { _id?: string; id?: string } }) => (
            <div key={request._id || request.id} className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-slate-900">{request.productId?.name || "Product"} ({request.productId?.sku || "NA"})</div>
                <Badge variant="warning">{request.status || "PENDING"}</Badge>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                <div>Request No: {request.requestNumber || "-"}</div>
                <div>Quantity: {request.requestedQuantity ?? 1}</div>
                <div>Requested On: {request.createdAt ? new Date(request.createdAt).toLocaleString() : "-"}</div>
                <div>Forwarded From: {request.forwardedFromSpaceId?.name || request.forwardedFromSpaceId?.code || "-"}</div>
                <div className="md:col-span-2">Justification: {request.businessJustification || "-"}</div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Lifecycle</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {buildLifecycle(request as { status?: string; createdAt?: string; managerApprovalAt?: string; itApprovalAt?: string; approvedAt?: string; fulfilledAt?: string; updatedAt?: string }).map((step) => (
                    <span key={step.label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      {step.label}: {step.value ? new Date(step.value).toLocaleString() : "-"}
                    </span>
                  ))}
                </div>
                {request.status ? <div className="mt-2">Current status: {request.status}</div> : null}
                {(request as { rejectionReason?: string }).rejectionReason ? <div className="mt-1">Rejection remark: {(request as { rejectionReason?: string }).rejectionReason}</div> : null}
              </div>
              {canReviewAssetRequests && ["PENDING", "MANAGER_APPROVED"].includes(String(request.status || "").toUpperCase()) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => approveRequestMutation.mutate({
                      requestId: (request._id || request.id) as string,
                      requestSpaceId: getRefId((request as { spaceId?: unknown }).spaceId),
                      status: request.status,
                    })}
                    disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                  >
                    {String(request.status || "").toUpperCase() === "MANAGER_APPROVED" ? "IT Approve" : "Approve & Route"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => rejectRequestMutation.mutate({
                      requestId: (request._id || request.id) as string,
                      requestSpaceId: getRefId((request as { spaceId?: unknown }).spaceId),
                    })}
                    disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
              {canViewTrailForRequest(request) && getRequestInventoryItemId(request) ? (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAuditTrailItemId((current) => current === getRequestInventoryItemId(request) ? null : getRequestInventoryItemId(request))}
                  >
                    {selectedAuditTrailItemId === getRequestInventoryItemId(request) ? "Hide transition logs" : "View transition logs"}
                  </Button>
                  {selectedAuditTrailItemId === getRequestInventoryItemId(request) ? (
                    <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs text-slate-700">
                      {isAuditTrailLoading ? (
                        <div>Loading logs...</div>
                      ) : auditTrailError ? (
                        <div>{getApiErrorMessage(auditTrailError)}</div>
                      ) : Array.isArray(selectedAuditTrailData?.data) && selectedAuditTrailData.data.length ? (
                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Transition log</div>
                          {selectedAuditTrailData.data.map((entry: { _id?: string; transactionType?: string; transactionDate?: string; remarks?: string; performedBy?: { firstName?: string; lastName?: string; email?: string; employeeId?: string }; fromWarehouseId?: { name?: string; code?: string }; toWarehouseId?: { name?: string; code?: string }; fromUserId?: { firstName?: string; lastName?: string; email?: string; employeeId?: string }; toUserId?: { firstName?: string; lastName?: string; email?: string; employeeId?: string } }) => (
                            <div key={entry._id} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="font-medium text-slate-900">{entry.transactionType || "TRANSACTION"}</div>
                                <div>{entry.transactionDate ? new Date(entry.transactionDate).toLocaleString() : "-"}</div>
                              </div>
                              <div className="mt-2 grid gap-1 md:grid-cols-2">
                                <div>Performed By: {[entry.performedBy?.firstName, entry.performedBy?.lastName].filter(Boolean).join(" ") || entry.performedBy?.email || entry.performedBy?.employeeId || "-"}</div>
                                <div>From Warehouse: {entry.fromWarehouseId?.name || entry.fromWarehouseId?.code || "-"}</div>
                                <div>To Warehouse: {entry.toWarehouseId?.name || entry.toWarehouseId?.code || "-"}</div>
                                <div>To User: {[entry.toUserId?.firstName, entry.toUserId?.lastName].filter(Boolean).join(" ") || entry.toUserId?.email || entry.toUserId?.employeeId || "-"}</div>
                                <div className="md:col-span-2">From User: {[entry.fromUserId?.firstName, entry.fromUserId?.lastName].filter(Boolean).join(" ") || entry.fromUserId?.email || entry.fromUserId?.employeeId || "-"}</div>
                                <div className="md:col-span-2">Remarks: {entry.remarks || "-"}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>No transition logs found for this item.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-xl border p-3 text-sm">No requests yet.</div>
        )}
      </div>
      {canViewAllSpaceRequests ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">All Requests In This Space</h2>
          {visibleRequests.length ? (
            visibleRequests.map((request: { _id?: string; id?: string; status?: string; productId?: { name?: string; sku?: string }; requestedQuantity?: number; requestNumber?: string; createdAt?: string; businessJustification?: string; forwardedFromSpaceId?: { name?: string; code?: string }; employeeId?: { firstName?: string; lastName?: string; email?: string }; inventoryItemId?: { _id?: string; id?: string } }) => (
              <div key={request._id || request.id} className="rounded-xl border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">{request.productId?.name || "Product"} ({request.productId?.sku || "NA"})</div>
                  <Badge variant="warning">{request.status || "PENDING"}</Badge>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                  <div>Request No: {request.requestNumber || "-"}</div>
                  <div>Quantity: {request.requestedQuantity ?? 1}</div>
                  <div>Requested By: {[request.employeeId?.firstName, request.employeeId?.lastName].filter(Boolean).join(" ") || request.employeeId?.email || "-"}</div>
                  <div>Requested On: {request.createdAt ? new Date(request.createdAt).toLocaleString() : "-"}</div>
                  <div>Forwarded From: {request.forwardedFromSpaceId?.name || request.forwardedFromSpaceId?.code || "-"}</div>
                  <div className="md:col-span-2">Justification: {request.businessJustification || "-"}</div>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Lifecycle</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {buildLifecycle(request as { status?: string; createdAt?: string; managerApprovalAt?: string; itApprovalAt?: string; approvedAt?: string; fulfilledAt?: string; updatedAt?: string }).map((step) => (
                      <span key={step.label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                        {step.label}: {step.value ? new Date(step.value).toLocaleString() : "-"}
                      </span>
                    ))}
                  </div>
                  {request.status ? <div className="mt-2">Current status: {request.status}</div> : null}
                  {(request as { rejectionReason?: string }).rejectionReason ? <div className="mt-1">Rejection remark: {(request as { rejectionReason?: string }).rejectionReason}</div> : null}
                </div>
                {canReviewAssetRequests && ["PENDING", "MANAGER_APPROVED"].includes(String(request.status || "").toUpperCase()) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={() => approveRequestMutation.mutate({
                        requestId: (request._id || request.id) as string,
                        requestSpaceId: getRefId((request as { spaceId?: unknown }).spaceId),
                        status: request.status,
                      })}
                      disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                    >
                      {String(request.status || "").toUpperCase() === "MANAGER_APPROVED" ? "IT Approve" : "Approve & Route"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectRequestMutation.mutate({
                        requestId: (request._id || request.id) as string,
                        requestSpaceId: getRefId((request as { spaceId?: unknown }).spaceId),
                      })}
                      disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
                {canViewTrailForRequest(request) && getRequestInventoryItemId(request) ? (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAuditTrailItemId((current) => current === getRequestInventoryItemId(request) ? null : getRequestInventoryItemId(request))}
                    >
                      {selectedAuditTrailItemId === getRequestInventoryItemId(request) ? "Hide transition logs" : "View transition logs"}
                    </Button>
                    {selectedAuditTrailItemId === getRequestInventoryItemId(request) ? (
                      <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs text-slate-700">
                        {isAuditTrailLoading ? (
                          <div>Loading logs...</div>
                        ) : auditTrailError ? (
                          <div>{getApiErrorMessage(auditTrailError)}</div>
                        ) : Array.isArray(selectedAuditTrailData?.data) && selectedAuditTrailData.data.length ? (
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Transition log</div>
                            {selectedAuditTrailData.data.map((entry: { _id?: string; transactionType?: string; transactionDate?: string; remarks?: string; performedBy?: { firstName?: string; lastName?: string; email?: string; employeeId?: string }; fromWarehouseId?: { name?: string; code?: string }; toWarehouseId?: { name?: string; code?: string }; fromUserId?: { firstName?: string; lastName?: string; email?: string; employeeId?: string }; toUserId?: { firstName?: string; lastName?: string; email?: string; employeeId?: string } }) => (
                              <div key={entry._id} className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-medium text-slate-900">{entry.transactionType || "TRANSACTION"}</div>
                                  <div>{entry.transactionDate ? new Date(entry.transactionDate).toLocaleString() : "-"}</div>
                                </div>
                                <div className="mt-2 grid gap-1 md:grid-cols-2">
                                  <div>Performed By: {[entry.performedBy?.firstName, entry.performedBy?.lastName].filter(Boolean).join(" ") || entry.performedBy?.email || entry.performedBy?.employeeId || "-"}</div>
                                  <div>From Warehouse: {entry.fromWarehouseId?.name || entry.fromWarehouseId?.code || "-"}</div>
                                  <div>To Warehouse: {entry.toWarehouseId?.name || entry.toWarehouseId?.code || "-"}</div>
                                  <div>To User: {[entry.toUserId?.firstName, entry.toUserId?.lastName].filter(Boolean).join(" ") || entry.toUserId?.email || entry.toUserId?.employeeId || "-"}</div>
                                  <div className="md:col-span-2">From User: {[entry.fromUserId?.firstName, entry.fromUserId?.lastName].filter(Boolean).join(" ") || entry.fromUserId?.email || entry.fromUserId?.employeeId || "-"}</div>
                                  <div className="md:col-span-2">Remarks: {entry.remarks || "-"}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>No transition logs found for this item.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl border p-3 text-sm">No requests in this space.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
