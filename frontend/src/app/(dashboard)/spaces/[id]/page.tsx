"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { useSpaceMembership } from "@/src/features/spaces/hooks/use-space-membership";
import { createJoinRequest, getMyJoinRequests, listJoinRequests, reviewJoinRequest } from "@/src/features/spaces/api";
import { createAssetRequest, itApproveAssetRequest, listAssetRequests, managerApproveAssetRequest, rejectAssetRequest } from "@/src/lib/assetRequestClient";
import { createInventoryItem, listInventory } from "@/src/lib/inventoryClient";
import { hasPermission } from "@/src/lib/permissions";
import { useAuth } from "@/src/features/auth/auth-provider";
import { apiClient, getApiErrorMessage } from "@/src/services/http/client";
import { getProducts } from "@/src/features/products/api";
import { listMembers, listUserRoles, replaceUserRoles } from "@/src/lib/spaceMemberClient";
import { listRoles } from "@/src/lib/roleClient";
import { Badge } from "@/src/components/ui/badge";

export default function SpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const spaceId = params?.id;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // membership hook will internally read `mySpaces`
  const { isMembershipKnown, isJoined, pendingJoin } = useSpaceMembership(spaceId);
  const isSuperAdmin =
    user?.userType === "ADMIN" ||
    String(user?.role || "").toUpperCase() === "SUPER_ADMIN";
  const canAccessSpaceData = isJoined || isSuperAdmin;
  const canRequestProduct = hasPermission(user, { action: "CREATE", resource: "ASSET_REQUEST" }) || isJoined;
  const canAddInventory = hasPermission(user, { action: "CREATE", resource: "INVENTORY" });
  const [requestProductId, setRequestProductId] = useState("");
  const [requestQty, setRequestQty] = useState("1");
  const [requestJustification, setRequestJustification] = useState("");
  const [inventoryProductId, setInventoryProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);
  const [memberRoleDraft, setMemberRoleDraft] = useState<Record<string, string>>({});
  const [requestActionMessage, setRequestActionMessage] = useState<string | null>(null);

  

  const fetchSpace = async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get(`/spaces/${spaceId}`);
    return response.data?.data ?? response.data;
  };

  const { data: space } = useQuery({
    queryKey: ["space", spaceId],
    queryFn: fetchSpace,
    enabled: Boolean(spaceId),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["space-products", spaceId],
    queryFn: () => getProducts(),
    enabled: Boolean(spaceId && (canRequestProduct || canAccessSpaceData)),
  });
  const { data: inventoryData } = useQuery({
    queryKey: ["space-inventory", spaceId],
    queryFn: () => listInventory({ spaceId, page: 1, limit: 20 }),
    enabled: Boolean(spaceId && canAccessSpaceData),
  });
  const { data: myRequestsData } = useQuery({
    queryKey: ["space-my-requests", spaceId],
    queryFn: () => listAssetRequests({ spaceId, page: 1, limit: 20 }),
    enabled: Boolean(spaceId && canAccessSpaceData),
  });
  useQuery({
    queryKey: ["space-my-join-request", spaceId],
    queryFn: () => getMyJoinRequests(spaceId as string),
    enabled: Boolean(spaceId && isMembershipKnown && !isJoined),
  });
  const canReviewJoinRequests = hasPermission(user, { action: "UPDATE", resource: "SPACE" }) || isSuperAdmin;
  const canReviewAssetRequests =
    hasPermission(user, { action: "MANAGER_APPROVE", resource: "ASSET_REQUEST" }) ||
    hasPermission(user, { action: "IT_APPROVE", resource: "ASSET_REQUEST" }) ||
    hasPermission(user, { action: "REJECT", resource: "ASSET_REQUEST" }) ||
    isSuperAdmin;
  const { data: joinRequests = [] } = useQuery({
    queryKey: ["space-join-requests", spaceId],
    queryFn: () => listJoinRequests(spaceId as string),
    enabled: Boolean(spaceId && canReviewJoinRequests),
  });
  const { data: members = [] } = useQuery({
    queryKey: ["space-members", spaceId],
    queryFn: () => listMembers(spaceId),
    enabled: Boolean(spaceId && canAccessSpaceData),
  });
  const { data: roleAssignments = [] } = useQuery({
    queryKey: ["space-user-roles", spaceId],
    queryFn: () => listUserRoles(spaceId),
    enabled: Boolean(spaceId && canAccessSpaceData),
  });
  const { data: roles = [] } = useQuery({
    queryKey: ["space-roles", spaceId],
    queryFn: () => listRoles(spaceId),
    enabled: Boolean(spaceId && canAccessSpaceData),
  });

  const joinMutation = useMutation({
    mutationFn: () => createJoinRequest(spaceId as string, { message: "Please grant access to this space." }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spaces", "my"] }),
        queryClient.invalidateQueries({ queryKey: ["space-my-join-request", spaceId] }),
      ]);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "approve" | "reject" }) =>
      reviewJoinRequest(spaceId as string, requestId, action),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["space-join-requests", spaceId] }),
        queryClient.invalidateQueries({ queryKey: ["spaces", "my"] }),
      ]);
    },
  });
  const requestMutation = useMutation({
    mutationFn: () =>
      createAssetRequest(
        {
          productId: requestProductId,
          requestedQuantity: Number(requestQty),
          businessJustification: requestJustification,
        },
        spaceId,
      ),
    onSuccess: async () => {
      setRequestJustification("");
      setRequestQty("1");
      await queryClient.invalidateQueries({ queryKey: ["space-my-requests", spaceId] });
    },
  });
  const addInventoryMutation = useMutation({
    mutationFn: () =>
      createInventoryItem(
        {
          productId: inventoryProductId,
          warehouseId,
          quantity: Number(quantity),
        },
        spaceId,
      ),
    onSuccess: async () => {
      setInventoryMessage("Inventory item created.");
      await queryClient.invalidateQueries({ queryKey: ["space-inventory", spaceId] });
    },
    onError: (error) => setInventoryMessage(getApiErrorMessage(error)),
  });
  const roleAssignmentsByUserId = useMemo(() => {
    const map = new Map<string, Array<{ _id?: string; id?: string; roleId?: { _id?: string; id?: string; name?: string; code?: string } }>>();

    (roleAssignments as Array<{ _id?: string; id?: string; userId?: { _id?: string; id?: string }; roleId?: { _id?: string; id?: string; name?: string; code?: string } }>).forEach((assignment) => {
      const userId = assignment.userId?._id || assignment.userId?.id;
      if (!userId) {
        return;
      }

      const current = map.get(String(userId)) || [];
      current.push(assignment);
      map.set(String(userId), current);
    });

    return map;
  }, [roleAssignments]);

  const canEditMemberRoles = useMemo(() => {
    if (isSuperAdmin) {
      return true;
    }
    return (members as Array<{ userId?: { _id?: string; id?: string }; roles?: Array<{ code?: string; name?: string }> }>).some((m) => {
      const memberUserId = m.userId?._id || m.userId?.id;
      const myId = user?.id;
      if (!memberUserId || !myId || String(memberUserId) !== String(myId)) {
        return false;
      }
      return (m.roles || []).some((r) => String(r.code || r.name || "").toUpperCase() === "SPACE_ADMIN");
    });
  }, [isSuperAdmin, members, user?.id]);
  const updateMemberRolesMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => replaceUserRoles(userId, [roleId], spaceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["space-members", spaceId] });
    },
  });
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, requestSpaceId, status }: { requestId: string; requestSpaceId?: string; status?: string }) => {
      const normalizedStatus = String(status || "").toUpperCase();
      if (normalizedStatus === "MANAGER_APPROVED") {
        await itApproveAssetRequest(requestId, { remarks: "IT approved from space request section." }, requestSpaceId || spaceId);
        return "IT approved and fulfilled.";
      }
      await managerApproveAssetRequest(requestId, { remarks: "Approved from space request section." }, requestSpaceId || spaceId);
      const currentSpaceType = String(space?.type || "").toUpperCase();
      return currentSpaceType === "MERCHANT"
        ? "Approved and sent to Warehouse queue."
        : "Approved and sent to IT queue.";
    },
    onSuccess: async (message) => {
      setRequestActionMessage(message);
      await queryClient.invalidateQueries({ queryKey: ["space-my-requests", spaceId] });
    },
    onError: (error) => setRequestActionMessage(getApiErrorMessage(error)),
  });
  const rejectRequestMutation = useMutation({
    mutationFn: ({ requestId, requestSpaceId }: { requestId: string; requestSpaceId?: string }) =>
      rejectAssetRequest(requestId, { rejectionReason: "Rejected from space request section." }, requestSpaceId || spaceId),
    onSuccess: async () => {
      setRequestActionMessage("Request rejected.");
      await queryClient.invalidateQueries({ queryKey: ["space-my-requests", spaceId] });
    },
    onError: (error) => setRequestActionMessage(getApiErrorMessage(error)),
  });

  const requests = useMemo(
    () => myRequestsData?.data?.items ?? myRequestsData?.items ?? [],
    [myRequestsData],
  );
  const inventoryItems = useMemo(
    () => inventoryData?.data?.items ?? inventoryData?.items ?? [],
    [inventoryData],
  );
  const inventoryProductIds = useMemo(
    () => new Set(inventoryItems.map((item: { productId?: { _id?: string; id?: string } | string }) => String(item.productId?._id || item.productId?.id || item.productId || "")).filter(Boolean)),
    [inventoryItems],
  );
  const spaceProducts = useMemo(
    () => (products as Array<{ _id?: string; id?: string; name?: string; sku?: string }>).filter((product) => {
      const productId = String(product._id || product.id || "");
      return !inventoryProductIds.size || inventoryProductIds.has(productId);
    }),
    [inventoryProductIds, products],
  );
  const visibleRequests = useMemo(
    () => requests.filter((request: { spaceId?: { _id?: string; id?: string } | string }) => {
      const requestSpaceId = String(request.spaceId?._id || request.spaceId?.id || request.spaceId || "");
      return !spaceId || requestSpaceId === String(spaceId);
    }),
    [requests, spaceId],
  );
  const myVisibleRequests = useMemo(
    () =>
      visibleRequests.filter((request: { employeeId?: { _id?: string; id?: string } | string }) => {
        const creatorId = String(request.employeeId?._id || request.employeeId?.id || request.employeeId || "");
        return Boolean(user?.id) && creatorId === String(user?.id);
      }),
    [user?.id, visibleRequests],
  );
  const canViewAllSpaceRequests = useMemo(() => {
    if (isSuperAdmin) {
      return true;
    }
    return (members as Array<{ userId?: { _id?: string; id?: string }; roles?: Array<{ code?: string; name?: string }> }>).some((m) => {
      const memberUserId = m.userId?._id || m.userId?.id;
      const myId = user?.id;
      if (!memberUserId || !myId || String(memberUserId) !== String(myId)) {
        return false;
      }
      return (m.roles || []).some((r) => String(r.code || r.name || "").toUpperCase() === "SPACE_ADMIN");
    });
  }, [isSuperAdmin, members, user?.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Space"
        title={String(space?.name ?? spaceId ?? "Space")}
        description={String(space?.description ?? "Manage products, requests, and inventory inside this space.")}
        actions={
          !isMembershipKnown ? (
            <Button disabled>Checking membership...</Button>
          ) : !isJoined ? (
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending || pendingJoin}>
              {pendingJoin ? "Join request pending" : joinMutation.isPending ? "Requesting..." : "Request to join"}
            </Button>
          ) : null
        }
      />

      {!isMembershipKnown ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Checking your membership for this space...</CardContent>
        </Card>
      ) : !canAccessSpaceData ? (
        pendingJoin ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">
              Your join request is pending approval. Once approved you will see products, requests, and inventory for this space.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">
              Join this space to view products, request products, and add inventory (as per your role permissions).
            </CardContent>
          </Card>
        )
      ) : null}

      {!isJoined && canRequestProduct ? (
        <Card>
          <CardHeader>
            <CardTitle>Request product</CardTitle>
            <CardDescription>You can request products for this space with your current role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Select id="productId" value={requestProductId} onChange={(e) => setRequestProductId(e.target.value)}>
                <option value="">Select product</option>
                {(products as Array<{ _id?: string; id?: string; name?: string; sku?: string }>).map((p) => {
                  const id = p._id || p.id;
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {p.name || "Unnamed"} ({p.sku || "NA"})
                    </option>
                  );
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestQty">Quantity</Label>
              <Input id="requestQty" value={requestQty} onChange={(e) => setRequestQty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestJustification">Justification</Label>
              <Input id="requestJustification" value={requestJustification} onChange={(e) => setRequestJustification(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Button
                onClick={() => requestMutation.mutate()}
                disabled={!requestProductId || !requestJustification.trim() || requestMutation.isPending}
              >
                {requestMutation.isPending ? "Submitting..." : "Request product"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canAccessSpaceData ? (
        <>
          {/* <Card>
            <CardHeader>
              <CardTitle>Products in this space</CardTitle>
              <CardDescription>Visible according to current space membership and permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(products as Array<{ _id?: string; id?: string; name?: string; sku?: string }>).length ? (
                (products as Array<{ _id?: string; id?: string; name?: string; sku?: string }>).map((p) => (
                  <div key={p._id || p.id} className="rounded border p-2">
                    {p.name || "Unnamed"} ({p.sku || "NA"})
                  </div>
                ))
              ) : (
                <div>No products found for this space.</div>
              )}
            </CardContent>
          </Card> */}

          {canRequestProduct ? (
            <Card>
              <CardHeader>
                <CardTitle>Request product</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product</Label>
                  <Select id="productId" value={requestProductId} onChange={(e) => setRequestProductId(e.target.value)}>
                    <option value="">Select product</option>
                    {spaceProducts.map((p) => {
                      const id = p._id || p.id;
                      if (!id) return null;
                      return (
                        <option key={id} value={id}>
                          {p.name || "Unnamed"} ({p.sku || "NA"})
                        </option>
                      );
                    })}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestQty">Quantity</Label>
                  <Input id="requestQty" value={requestQty} onChange={(e) => setRequestQty(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestJustification">Justification</Label>
                  <Input id="requestJustification" value={requestJustification} onChange={(e) => setRequestJustification(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <Button
                    onClick={() => requestMutation.mutate()}
                    disabled={!requestProductId || !requestJustification.trim() || requestMutation.isPending}
                  >
                    {requestMutation.isPending ? "Submitting..." : "Request product"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {canAddInventory ? (
            <Card>
              <CardHeader>
                <CardTitle>Add inventory item</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Input placeholder="Product ID" value={inventoryProductId} onChange={(e) => setInventoryProductId(e.target.value)} />
                <Input placeholder="Warehouse ID" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
                <Input placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <div className="md:col-span-3 flex items-center gap-3">
                  <Button onClick={() => addInventoryMutation.mutate()} disabled={addInventoryMutation.isPending}>
                    {addInventoryMutation.isPending ? "Adding..." : "Add inventory"}
                  </Button>
                  {inventoryMessage ? <span className="text-sm text-slate-600">{inventoryMessage}</span> : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {canReviewJoinRequests ? (
            <Card>
              <CardHeader>
                <CardTitle>Join requests</CardTitle>
                <CardDescription>Pending requests from members asking to join this space.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(joinRequests as Array<{ _id?: string; id?: string; status?: string; userId?: { firstName?: string; lastName?: string; email?: string } }>).length ? (
                  (joinRequests as Array<{ _id?: string; id?: string; status?: string; userId?: { firstName?: string; lastName?: string; email?: string } }>).map((request) => {
                    const requestId = request._id || request.id;
                    const requesterName = [request.userId?.firstName, request.userId?.lastName].filter(Boolean).join(" ");
                    const requesterLabel = requesterName || request.userId?.email || "Unknown member";

                    return (
                      <div key={requestId} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
                        <div>
                          <div className="font-medium text-slate-900">{requesterLabel}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{request.status || "PENDING"}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => reviewMutation.mutate({ requestId: requestId as string, action: "approve" })}
                            disabled={reviewMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => reviewMutation.mutate({ requestId: requestId as string, action: "reject" })}
                            disabled={reviewMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div>No join requests yet.</div>
                )}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Space members and roles</CardTitle>
              <CardDescription>Every member with current role assignments for this space.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(members as Array<{ _id?: string; id?: string; userId?: { firstName?: string; lastName?: string; email?: string }; roles?: Array<{ _id?: string; id?: string; code?: string; name?: string }> }>).length ? (
                (members as Array<{ _id?: string; id?: string; userId?: { firstName?: string; lastName?: string; email?: string }; roles?: Array<{ _id?: string; id?: string; code?: string; name?: string }> }>).map((member) => {
                  const memberId = member._id || member.id || "";
                  const memberUserId = member.userId?._id || member.userId?.id || "";
                  const memberAssignments = roleAssignmentsByUserId.get(String(memberUserId || memberId)) || [];
                  const currentRoleId = memberAssignments[0]?.roleId?._id || memberAssignments[0]?.roleId?.id || member.roles?.[0]?._id || member.roles?.[0]?.id || "";
                  const selectedRoleId = memberRoleDraft[memberId] ?? currentRoleId;
                  const name = [member.userId?.firstName, member.userId?.lastName].filter(Boolean).join(" ");
                  return (
                    <div key={memberId} className="rounded border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{name || member.userId?.email || "Unknown member"}</div>
                          <div className="text-xs text-slate-500">{member.userId?.email || "No email"}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {memberAssignments.length
                            ? memberAssignments.map((assignment) => (
                                <Badge key={assignment._id || assignment.id || assignment.roleId?._id || assignment.roleId?.id} variant="secondary">
                                  {assignment.roleId?.name || assignment.roleId?.code || "ROLE"}
                                </Badge>
                              ))
                            : (member.roles || []).map((role) => (
                            <Badge key={role._id || role.id || role.code || role.name} variant="secondary">
                              {role.name || role.code || "ROLE"}
                            </Badge>
                            ))}
                        </div>
                      </div>
                      {canEditMemberRoles ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Select value={selectedRoleId} onChange={(e) => setMemberRoleDraft((prev) => ({ ...prev, [memberId]: e.target.value }))}>
                            <option value="">Select role</option>
                            {(roles as Array<{ _id?: string; id?: string; name?: string; code?: string }>).map((role) => {
                              const roleId = role._id || role.id || "";
                              if (!roleId) return null;
                              return (
                                <option key={roleId} value={roleId}>
                                  {role.name || role.code || "Role"}
                                </option>
                              );
                            })}
                          </Select>
                          <Button
                            variant="outline"
                            onClick={() => updateMemberRolesMutation.mutate({ userId: memberUserId, roleId: selectedRoleId })}
                            disabled={!selectedRoleId || !memberUserId || updateMemberRolesMutation.isPending}
                          >
                            {updateMemberRolesMutation.isPending ? "Updating..." : "Update role"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div>No members found for this space.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My requests</CardTitle>
              <CardDescription>Track each request with product, quantity, routing, and status details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {requestActionMessage ? <div className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">{requestActionMessage}</div> : null}
              {myVisibleRequests.length ? (
                myVisibleRequests.map((request: { _id?: string; id?: string; status?: string; requestedQuantity?: number; productId?: { name?: string; sku?: string }; requestNumber?: string; createdAt?: string; businessJustification?: string; forwardedFromSpaceId?: { name?: string; code?: string } }) => (
                  <div key={request._id || request.id} className="rounded border p-3">
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
                    {canReviewAssetRequests && ["PENDING", "MANAGER_APPROVED"].includes(String(request.status || "").toUpperCase()) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          onClick={() => approveRequestMutation.mutate({
                            requestId: (request._id || request.id) as string,
                            requestSpaceId: String((request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?._id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?.id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId || ""),
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
                            requestSpaceId: String((request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?._id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?.id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId || ""),
                          })}
                          disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div>No requests yet.</div>
              )}
            </CardContent>
          </Card>
          {canViewAllSpaceRequests ? (
            <Card>
              <CardHeader>
                <CardTitle>All requests in this space</CardTitle>
                <CardDescription>Visible only to Super Admin and Space Admin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {visibleRequests.length ? (
                  visibleRequests.map((request: { _id?: string; id?: string; status?: string; requestedQuantity?: number; productId?: { name?: string; sku?: string }; requestNumber?: string; createdAt?: string; businessJustification?: string; forwardedFromSpaceId?: { name?: string; code?: string }; employeeId?: { firstName?: string; lastName?: string; email?: string } }) => (
                    <div key={request._id || request.id} className="rounded border p-3">
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
                      {canReviewAssetRequests && ["PENDING", "MANAGER_APPROVED"].includes(String(request.status || "").toUpperCase()) ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            onClick={() => approveRequestMutation.mutate({
                              requestId: (request._id || request.id) as string,
                              requestSpaceId: String((request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?._id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?.id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId || ""),
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
                              requestSpaceId: String((request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?._id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId?.id || (request as { spaceId?: { _id?: string; id?: string } | string }).spaceId || ""),
                            })}
                            disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div>No requests in this space yet.</div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Inventory snapshot</CardTitle>
              <CardDescription>Current inventory state with traceable item-level details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {inventoryItems.length ? (
                inventoryItems.map((item: { _id?: string; id?: string; status?: string; quantity?: number; serialNumber?: string; assetTag?: string; condition?: string; productId?: { name?: string; sku?: string }; warehouseId?: { name?: string; code?: string }; createdAt?: string; updatedAt?: string }) => (
                  <div key={item._id || item.id} className="rounded border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-slate-900">{item.productId?.name || "Product"} ({item.productId?.sku || "NA"})</div>
                      <Badge variant="success">{item.status || "IN_STOCK"}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                      <div>Quantity: {item.quantity ?? 0}</div>
                      <div>Condition: {item.condition || "-"}</div>
                      <div>Warehouse: {item.warehouseId?.name || item.warehouseId?.code || "-"}</div>
                      <div>Serial No: {item.serialNumber || "-"}</div>
                      <div>Asset Tag: {item.assetTag || "-"}</div>
                      <div>Updated At: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div>No inventory items yet.</div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
