"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { PageHeader } from "@/src/components/layout/page-header";
import { MetricsCard } from "@/src/shared/components/metrics-card";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { Timeline } from "@/src/shared/components/timeline";
import { deleteSpace, getSpaceById, listJoinRequests, reviewJoinRequest, updateSpace } from "@/src/features/spaces/api";
import { useAuth } from "@/src/features/auth/auth-provider";
import { BACKEND_PERMISSIONS, can } from "@/src/lib/permissions";
import { listMembers, listUserRoles, replaceUserRoles } from "@/src/lib/spaceMemberClient";
import { listRoles } from "@/src/lib/roleClient";
import { fulfillAssetRequest, itApproveAssetRequest, listAssetRequests, managerApproveAssetRequest, rejectAssetRequest, zonalApproveAssetRequest } from "@/src/lib/assetRequestClient";
import { listInventory } from "@/src/lib/inventoryClient";
import { queryKeys } from "@/src/constants/query-keys";
import { getApiErrorMessage } from "@/src/services/http/client";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = "items" in root ? (root as { items?: unknown[] }).items : root;
  return Array.isArray(items) ? items : [];
}

function normalizeLabel(value?: string) {
  return (value || "").trim().toUpperCase().replace(/[-\s]/g, "_");
}

export default function SpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const spaceId = params?.id ?? "";
  const { user } = useAuth();
  type SpaceMember = { _id?: string; id?: string; name?: string; userId?: { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string }; roles?: Array<{ name?: string; code?: string }> };
  type SpaceUserRole = { _id?: string; id?: string; userId?: { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string }; roleId?: { _id?: string; id?: string; name?: string; code?: string } | string };
  type SpaceRoleOption = { _id?: string; id?: string; name?: string; code?: string; isSystemRole?: boolean; type?: string };
  type SpaceJoinRequest = { _id?: string; id?: string; status?: string; reason?: string; message?: string; userId?: { firstName?: string; lastName?: string } };
  type SpaceAssetRequest = { _id?: string; id?: string; status?: string; currentStepKey?: string; productId?: { name?: string } | string; requestedQuantity?: number; businessJustification?: string; remarks?: string; rejectionReason?: string };
  type SpaceInventoryItem = { _id?: string; id?: string; assetTag?: string; serialNumber?: string; status?: string };

  const { data: space, isLoading: spaceLoading } = useQuery({
    queryKey: ["spaces", spaceId],
    queryFn: () => getSpaceById(spaceId),
    enabled: Boolean(spaceId),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["space-members", spaceId],
    queryFn: () => listMembers(spaceId),
    enabled: Boolean(spaceId),
  });

  const { data: userRoles = [], isLoading: userRolesLoading } = useQuery({
    queryKey: ["space-user-roles", spaceId],
    queryFn: () => listUserRoles(spaceId),
    enabled: Boolean(spaceId),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", spaceId],
    queryFn: () => listRoles(spaceId),
    enabled: Boolean(spaceId),
  });

  const { data: joinRequests = [], isLoading: joinRequestsLoading } = useQuery({
    queryKey: ["space-join-requests", spaceId],
    queryFn: () => listJoinRequests(spaceId),
    enabled: Boolean(spaceId),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["space-asset-requests", spaceId],
    queryFn: () => listAssetRequests({ spaceId, page: 1, limit: 20 }),
    enabled: Boolean(spaceId),
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["space-inventory", spaceId],
    queryFn: () => listInventory({ spaceId, page: 1, limit: 20 }),
    enabled: Boolean(spaceId),
  });

  const reviewJoinRequestMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "approve" | "reject" }) =>
      reviewJoinRequest(spaceId, requestId, action),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["space-join-requests", spaceId] }),
        queryClient.invalidateQueries({ queryKey: ["space-members", spaceId] }),
        queryClient.invalidateQueries({ queryKey: ["space-user-roles", spaceId] }),
        queryClient.invalidateQueries({ queryKey: ["members", spaceId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.spaces.my }),
      ]);
    },
  });

  const [assetRemarksByRequest, setAssetRemarksByRequest] = useState<Record<string, string>>({});

  const assetRequestActionMutation = useMutation({
    mutationFn: async ({ request, action, remarks }: { request: SpaceAssetRequest; action: "approve" | "reject"; remarks: string }) => {
      const requestId = request._id || request.id || "";
      const stepKey = request.currentStepKey || (request.status === "PENDING_IT" ? "IT_APPROVAL" : request.status === "PENDING_ZONAL_MANAGER" || request.status === "PENDING_ZONAL" ? "ZONAL_APPROVAL" : request.status === "FULFILLMENT_PENDING" || request.status === "PENDING_FULFILLMENT" ? "FULFILLMENT" : "MANAGER_APPROVAL");

      if (action === "approve") {
        if (stepKey === "WAREHOUSE_FULFILLMENT" || stepKey === "FULFILLMENT") return fulfillAssetRequest(requestId, { remarks }, spaceId);
        if (stepKey === "IT_APPROVAL") return itApproveAssetRequest(requestId, { remarks }, spaceId);
        if (stepKey === "ZONAL_APPROVAL" || stepKey === "ZONAL_MANAGER_APPROVAL") return zonalApproveAssetRequest(requestId, { remarks }, spaceId);
        if (stepKey === "MANAGER_APPROVAL") return managerApproveAssetRequest(requestId, { remarks }, spaceId);
        return managerApproveAssetRequest(requestId, { remarks }, spaceId);
      }

      return rejectAssetRequest(requestId, { stepKey, rejectionReason: remarks, remarks }, spaceId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["space-asset-requests", spaceId] });
    },
  });
  const [spaceName, setSpaceName] = useState("");
  const [spaceCode, setSpaceCode] = useState("");
  const [spaceType, setSpaceType] = useState<"EMPLOYEE" | "MERCHANT">("EMPLOYEE");
  const [spaceDescription, setSpaceDescription] = useState("");
  const [spaceActionMessage, setSpaceActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!space) return;
    setSpaceName(space.name || "");
    setSpaceCode(space.code || "");
    setSpaceType(space.type === "MERCHANT" ? "MERCHANT" : "EMPLOYEE");
    setSpaceDescription(space.description || "");
  }, [space]);
  const pendingAssetRequestId = assetRequestActionMutation.isPending
    ? assetRequestActionMutation.variables?.request._id || assetRequestActionMutation.variables?.request.id || ""
    : "";

  const membersList = members as SpaceMember[];
  const userRoleList = userRoles as SpaceUserRole[];
  const joinRequestList = joinRequests as SpaceJoinRequest[];
  const requests = getItems(requestsData) as SpaceAssetRequest[];
  const inventory = getItems(inventoryData) as SpaceInventoryItem[];
  const roleOptions = (getItems(roles) as SpaceRoleOption[]).filter((role) => role.type !== "system" && role.code !== "SUPER_ADMIN");
  const roleLabelByUserId = new Map<string, string[]>();
  const roleIdByUserId = new Map<string, string>();
  const currentUserId = String(user?.id || user?._id || "");

  for (const assignment of userRoleList) {
    const userKey = String(assignment.userId?._id || assignment.userId?.id || "");
    const roleLabel = typeof assignment.roleId === "string" ? assignment.roleId : assignment.roleId?.name || assignment.roleId?.code || "Role";
    const roleId = typeof assignment.roleId === "string" ? assignment.roleId : assignment.roleId?._id || assignment.roleId?.id || "";

    if (!userKey) continue;

    const currentLabels = roleLabelByUserId.get(userKey) || [];
    roleLabelByUserId.set(userKey, [...currentLabels, roleLabel]);

    if (roleId && !roleIdByUserId.has(userKey)) {
      roleIdByUserId.set(userKey, roleId);
    }
  }

  const currentUserSpaceRoles = currentUserId ? roleLabelByUserId.get(currentUserId) || [] : [];
  const isSpaceAdmin = currentUserSpaceRoles.some((label) => normalizeLabel(label) === "SPACE_ADMIN");
  const isInventoryManager = currentUserSpaceRoles.some((label) => normalizeLabel(label) === "INVENTORY_MANAGER");
  const canAssignRoles = can(user, BACKEND_PERMISSIONS.ASSIGN_ROLE, spaceId) || currentUserSpaceRoles.some((label) => normalizeLabel(label) === "SPACE_ADMIN");
  const canReviewJoinRequests = canAssignRoles;
  const canReviewAssetRequests =
    can(user, BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST, spaceId) ||
    can(user, BACKEND_PERMISSIONS.FULFILL_ASSET_REQUEST, spaceId) ||
    can(user, BACKEND_PERMISSIONS.UPDATE_ASSET_REQUEST, spaceId) ||
    isSpaceAdmin ||
    isInventoryManager;
  const canUpdateSpace = can(user, BACKEND_PERMISSIONS.UPDATE_SPACE, spaceId);
  const canDeleteSpace = can(user, BACKEND_PERMISSIONS.DELETE_SPACE, spaceId);
  const [selectedRoleByMember, setSelectedRoleByMember] = useState<Record<string, string>>({});

  const updateSpaceMutation = useMutation({
    mutationFn: () => updateSpace(spaceId, { name: spaceName.trim(), code: spaceCode.trim(), type: spaceType, description: spaceDescription.trim() }),
    onSuccess: async () => {
      setSpaceActionMessage("Space updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spaces", spaceId] }),
        queryClient.invalidateQueries({ queryKey: ["spaces"] }),
      ]);
    },
    onError: (error) => setSpaceActionMessage(getApiErrorMessage(error)),
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: () => deleteSpace(spaceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] });
      router.push("/spaces");
    },
    onError: (error) => setSpaceActionMessage(getApiErrorMessage(error)),
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => replaceUserRoles(userId, [roleId], spaceId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["space-members", spaceId] }),
        queryClient.invalidateQueries({ queryKey: ["space-user-roles", spaceId] }),
      ]);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Space"
        title={space?.name || `Space ${spaceId}`}
        description="Overview, members, roles, products, inventory, requests, join requests, and workflows for the selected operational space."
        actions={<StatusBadge status="info">{spaceLoading ? "Loading" : "Active"}</StatusBadge>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard label="Members" value={membersLoading ? "..." : String(membersList.length)} description="Approved users in the space" />
        <MetricsCard label="Join requests" value={joinRequestsLoading ? "..." : String(joinRequestList.length)} description="Pending membership requests" />
        <MetricsCard label="Open requests" value={requestsLoading ? "..." : String(requests.length)} description="Requests in progress" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Identity and operating context for this space.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Space name</p>
                <p className="mt-1 font-medium text-slate-900">{space?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Space type</p>
                <p className="mt-1 font-medium text-slate-900">{space?.type || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Code</p>
                <p className="mt-1 font-medium text-slate-900">{space?.code || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</p>
                <p className="mt-1 font-medium text-slate-900">{space?.isActive === false ? "Inactive" : "Active"}</p>
              </div>
            </CardContent>
          </Card>

          {canUpdateSpace || canDeleteSpace ? (
            <Card>
              <CardHeader>
                <CardTitle>Manage space</CardTitle>
                <CardDescription>Update this space or remove it from active operations.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manage-space-name">Name</Label>
                  <Input id="manage-space-name" value={spaceName} onChange={(event) => setSpaceName(event.target.value)} disabled={!canUpdateSpace} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manage-space-code">Code</Label>
                  <Input id="manage-space-code" value={spaceCode} onChange={(event) => setSpaceCode(event.target.value.toUpperCase())} disabled={!canUpdateSpace} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manage-space-type">Type</Label>
                  <Select id="manage-space-type" value={spaceType} onChange={(event) => setSpaceType(event.target.value as "EMPLOYEE" | "MERCHANT")} disabled={!canUpdateSpace}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MERCHANT">Merchant</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manage-space-description">Description</Label>
                  <Input id="manage-space-description" value={spaceDescription} onChange={(event) => setSpaceDescription(event.target.value)} disabled={!canUpdateSpace} />
                </div>
                <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                  {canUpdateSpace ? (
                    <Button disabled={!spaceName.trim() || !spaceCode.trim() || updateSpaceMutation.isPending} onClick={() => updateSpaceMutation.mutate()}>
                      {updateSpaceMutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                  ) : null}
                  {canDeleteSpace ? (
                    <Button
                      variant="outline"
                      disabled={deleteSpaceMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete space "${space?.name || spaceId}"?`)) deleteSpaceMutation.mutate();
                      }}
                    >
                      {deleteSpaceMutation.isPending ? "Deleting..." : "Delete space"}
                    </Button>
                  ) : null}
                  {spaceActionMessage ? <span className="text-sm text-slate-600">{spaceActionMessage}</span> : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Approved people who can use this space.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {membersList.length ? membersList.map((member) => {
                const memberUserKey = String(member.userId?._id || member.userId?.id || "");
                const roleLabels = roleLabelByUserId.get(memberUserKey) || member.roles?.map((role) => role.name || role.code).filter(Boolean) || [];
                const isCurrentUserMember = memberUserKey === currentUserId;
                const canEditMemberRoles = canAssignRoles && Boolean(memberUserKey) && !isCurrentUserMember && roleOptions.length > 0;
                const selectedRoleId = selectedRoleByMember[memberUserKey] || roleIdByUserId.get(memberUserKey) || roleOptions[0]?._id || roleOptions[0]?.id || "";

                return (
                  <div key={member._id || member.id || member.userId?.email} className="rounded-2xl border border-orange-100 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{member.name || [member.userId?.firstName, member.userId?.lastName].filter(Boolean).join(" ") || member.userId?.email || "Member"}</p>
                        <p className="text-sm text-slate-600">{roleLabels.join(", ") || (userRolesLoading ? "Loading roles..." : "Role not assigned")}</p>
                      </div>
                      {isCurrentUserMember ? <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">You</span> : null}
                    </div>
                    {canAssignRoles && !isCurrentUserMember && roleOptions.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-3 text-sm text-slate-600">
                        No editable roles are available for this space.
                      </div>
                    ) : null}
                    {canEditMemberRoles ? (
                      <div className="mt-4 flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1 space-y-2">
                          <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Role</label>
                          <select
                            className="flex h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                            value={selectedRoleId}
                            onChange={(event) => setSelectedRoleByMember((current) => ({ ...current, [memberUserKey]: event.target.value }))}
                          >
                            {roleOptions.map((role) => {
                              const roleId = role._id || role.id || "";
                              if (!roleId) return null;

                              return (
                                <option key={roleId} value={roleId}>
                                  {role.name || role.code || roleId}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <Button
                          variant="outline"
                          disabled={!selectedRoleId || roleUpdateMutation.isPending}
                          onClick={() => roleUpdateMutation.mutate({ userId: memberUserKey, roleId: selectedRoleId })}
                        >
                          Update role
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              }) : (
                <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">No members loaded for this space.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
              <CardDescription>Most relevant events in the space lifecycle.</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline
                items={[
                  { title: "Space created", description: "The space was created by an administrator.", state: "complete" },
                  { title: "Join requests approved", description: "Membership requests have been approved for core users.", state: "complete" },
                  { title: "Workflow configured", description: "Request approval flow linked to the space.", state: "current" },
                  { title: "Catalog expanded", description: "Products, warehouses, and merchants continue to grow.", state: "upcoming" },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Tracked assets currently scoped to this space.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {inventoryLoading ? <div>Loading inventory...</div> : inventory.length ? inventory.map((item: { _id?: string; id?: string; assetTag?: string; serialNumber?: string; status?: string }) => (
                <div key={item._id || item.id || item.assetTag} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <p className="font-medium text-slate-900">{item.assetTag || item.serialNumber || "Inventory item"}</p>
                  <p>{item.status || "UNKNOWN"}</p>
                </div>
              )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">No inventory loaded.</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join requests</CardTitle>
              <CardDescription>Access requests awaiting review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {joinRequestsLoading ? <div>Loading join requests...</div> : joinRequestList.length ? joinRequestList.map((request) => (
                <div key={request._id || request.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{[request.userId?.firstName, request.userId?.lastName].filter(Boolean).join(" ") || "Join request"}</p>
                      <p>{request.reason || request.message || request.status || "Pending"}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{request.status || "PENDING"}</span>
                  </div>
                  {canReviewJoinRequests ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => reviewJoinRequestMutation.mutate({ requestId: request._id || request.id || "", action: "approve" })} disabled={reviewJoinRequestMutation.isPending || !(request._id || request.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewJoinRequestMutation.mutate({ requestId: request._id || request.id || "", action: "reject" })} disabled={reviewJoinRequestMutation.isPending || !(request._id || request.id)}>
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">No join requests found.</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requests</CardTitle>
              <CardDescription>Live requests in this space.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {requestsLoading ? <div>Loading requests...</div> : requests.length ? requests.map((request: SpaceAssetRequest) => (
                <div key={request._id || request.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <p className="font-medium text-slate-900">{typeof request.productId === "string" ? request.productId : request.productId?.name || "Request"}</p>
                  <p>{request.status || "PENDING"} · Qty {request.requestedQuantity ?? 0}</p>
                  {request.businessJustification ? <p className="mt-3 text-sm text-slate-600">{request.businessJustification}</p> : null}
                  {request.remarks ? <p className="mt-2 text-xs text-slate-500">Remarks: {request.remarks}</p> : null}
                  {request.rejectionReason ? <p className="mt-2 text-xs text-rose-600">Rejection: {request.rejectionReason}</p> : null}
                  {canReviewAssetRequests && request.status && /pending|review|approve/i.test(request.status) ? (
                    <div className="mt-4 space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500" htmlFor={`asset-remarks-${request._id || request.id}`}>Remarks</label>
                        <textarea
                          id={`asset-remarks-${request._id || request.id}`}
                          value={assetRemarksByRequest[request._id || request.id || ""] || ""}
                          onChange={(event) => setAssetRemarksByRequest((current) => ({ ...current, [request._id || request.id || ""]: event.target.value }))}
                          placeholder="Add approval or rejection remarks"
                          rows={3}
                          className="min-h-24 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={pendingAssetRequestId === (request._id || request.id)}
                          onClick={() => {
                            const requestId = request._id || request.id || "";
                            assetRequestActionMutation.mutate({ request: request as SpaceAssetRequest, action: "approve", remarks: assetRemarksByRequest[requestId] || "" });
                          }}
                        >
                          {pendingAssetRequestId === (request._id || request.id) && assetRequestActionMutation.variables?.action === "approve" ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingAssetRequestId === (request._id || request.id)}
                          onClick={() => {
                            const requestId = request._id || request.id || "";
                            assetRequestActionMutation.mutate({ request: request as SpaceAssetRequest, action: "reject", remarks: assetRemarksByRequest[requestId] || "" });
                          }}
                        >
                          {pendingAssetRequestId === (request._id || request.id) && assetRequestActionMutation.variables?.action === "reject" ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">No live requests found.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
