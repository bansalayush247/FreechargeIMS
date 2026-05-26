"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../../src/lib/api";
import { logger } from "../../../../src/lib/logger";
import { useToast } from "../../../../src/components/toastProvider";
import { Modal } from "../../../../src/components/modal";
import { useAuth } from "../../../../src/auth/authContext";
import { useConfirm } from "../../../../src/components/confirmProvider";
import { listInventory } from "../../../../src/lib/inventoryClient";
import {
  createAssetRequest,
  forwardAssetRequest,
  itApproveAssetRequest,
  listAssetRequests,
  managerApproveAssetRequest,
  rejectAssetRequest,
} from "../../../../src/lib/assetRequestClient";
import { listProducts } from "../../../../src/lib/productClient";
import { getInventoryItemAuditTrail } from "../../../../src/lib/inventoryTransactionClient";

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();
  const currentUserId = (user as any)?._id ?? user?.id;
  const isAdminUserType = (user as any)?.userType === "ADMIN";

  const [space, setSpace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [jrLoading, setJrLoading] = useState(false);
  const [jrError, setJrError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [memberSpaces, setMemberSpaces] = useState<any[]>([]);
  const [memberSpacesLoading, setMemberSpacesLoading] = useState(false);
  const [memberSpacesError, setMemberSpacesError] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [memberRoleByUserId, setMemberRoleByUserId] = useState<Record<string, string>>({});
  const [updatingRoleForUserId, setUpdatingRoleForUserId] = useState<string | null>(null);
  const [deletingSpace, setDeletingSpace] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<any | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalNotes, setModalNotes] = useState<string>("");
  const [modalRequesting, setModalRequesting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [transitOpen, setTransitOpen] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [transitTransactions, setTransitTransactions] = useState<any[]>([]);
  const [transitInventoryItemId, setTransitInventoryItemId] = useState<string | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardRequest, setForwardRequest] = useState<any | null>(null);
  const [forwardTargetSpaceId, setForwardTargetSpaceId] = useState<string>("");
  const [forwardSubmitting, setForwardSubmitting] = useState(false);
  const availableByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of inventory) {
      const product = item.productId ?? item.product ?? {};
      const productId = typeof product === "string" ? product : product?._id ?? product?.id;
      if (!productId) continue;
      const rawQty = item.quantity ?? item.stock;
      const qty = Number.isFinite(Number(rawQty)) ? Number(rawQty) : 1;
      map[productId] = (map[productId] ?? 0) + qty;
    }
    return map;
  }, [inventory]);

  const canReviewJoinRequests = isAdminUserType || permissions.includes("UPDATE_SPACE");
  const canViewAssetRequests = isAdminUserType || permissions.includes("VIEW_ASSET_REQUEST");
  const canManagerApprove = isAdminUserType || permissions.includes("MANAGER_APPROVE_ASSET_REQUEST");
  const canItApprove = isAdminUserType || permissions.includes("IT_APPROVE_ASSET_REQUEST");
  const canReject = isAdminUserType || permissions.includes("REJECT_ASSET_REQUEST");
  const canForwardRequests = isAdminUserType || permissions.includes("FORWARD_ASSET_REQUEST");
  const canManageMembers = isAdminUserType || permissions.includes("ASSIGN_ROLE") || permissions.includes("UPDATE_SPACE");
  const canUpdateSpace = isAdminUserType || permissions.includes("UPDATE_SPACE");
  const canDeleteSpace = isAdminUserType || permissions.includes("DELETE_SPACE");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/spaces/${id}`);
        if (!mounted) return;
        setSpace(res.data?.data ?? res.data ?? null);
      } catch (err: any) {
        logger.warn("Failed to fetch space", { id, err: String(err) });
        setError("Could not load space.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    setDescriptionDraft(space?.description ?? "");
    setEditingDescription(false);
  }, [space?.description]);

  useEffect(() => {
    if (!id || !currentUserId) {
      setPermissions([]);
      setPermissionsLoaded(true);
      return;
    }

    let mounted = true;

    async function loadPermissions() {
      setPermissionsLoaded(false);
      try {
        const res = await apiClient.get(`/space-members/user-roles`, {
          params: { userId: currentUserId, page: 1, limit: 50 },
          headers: { "x-space-id": id },
        });
        const payload = res.data?.data ?? res.data ?? {};
        const items = Array.isArray(payload.items) ? payload.items : payload;
        const nextPermissions = new Set<string>();
        if (Array.isArray(items)) {
          items.forEach((assignment) => {
            const role = assignment?.roleId ?? assignment?.role;
            const rolePermissions = role?.permissions;
            if (Array.isArray(rolePermissions)) {
              rolePermissions.forEach((permission) => nextPermissions.add(permission));
            }
          });
        }

        if (mounted) {
          setPermissions(Array.from(nextPermissions));
        }
      } catch (err: any) {
        if (mounted) {
          setPermissions([]);
        }
      } finally {
        if (mounted) {
          setPermissionsLoaded(true);
        }
      }
    }

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, [id, currentUserId]);

  async function loadJoinRequests() {
    setJrLoading(true);
    setJrError(null);
    try {
      if (canReviewJoinRequests) {
        const res = await apiClient.get(`/spaces/${id}/join-requests`, { headers: { "x-space-id": id } });
        const payload = res.data?.data ?? res.data ?? {};
        const items = Array.isArray(payload.items) ? payload.items : payload;
        setJoinRequests(Array.isArray(items) ? items : []);
        return;
      }

      if (!currentUserId) {
        setJoinRequests([]);
        return;
      }

      const res = await apiClient.get(`/spaces/${id}/join-requests/my`, { headers: { "x-space-id": id } });
      const payload = res.data?.data ?? res.data ?? {};
      const items = Array.isArray(payload.items) ? payload.items : payload;
      setJoinRequests(Array.isArray(items) ? items : []);
    } catch (err: any) {
      // If 403, means current user is not an admin for this space — hide admin panel silently
      if (err?.response?.status === 403) {
        setJoinRequests([]);
        if (canReviewJoinRequests) {
          setJrError("not-authorized");
        }
        return;
      }

      setJrError("Failed to load join requests");
    } finally {
      setJrLoading(false);
    }
  }

  async function loadInventory() {
    if (!id) return;
    setInvLoading(true);
    try {
      const inv = await listInventory({ spaceId: id, page: 1, limit: 50 });
      const items = inv.data?.items ?? inv.items ?? inv.data ?? inv ?? [];
      setInventory(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setInventory([]);
    } finally {
      setInvLoading(false);
    }
  }

  async function loadRequests() {
    if (!id) return;
    setReqLoading(true);
    setReqError(null);
    try {
      const ar = await listAssetRequests({ spaceId: id, page: 1, limit: 20 });
      const items = ar.data?.items ?? ar.items ?? ar.data ?? ar ?? [];
      setRequests(Array.isArray(items) ? items : []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setRequests([]);
        setReqError("not-authorized");
        return;
      }
      setReqError("Failed to load requests.");
      setRequests([]);
    } finally {
      setReqLoading(false);
    }
  }

  async function loadProducts() {
    if (!id) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await listProducts({ spaceId: id, page: 1, limit: 50 });
      const payload = res.data ?? res ?? {};
      const items = payload.products ?? payload.items ?? payload.data ?? [];
      setProducts(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setProductsError("Failed to load products.");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    setInvLoading(true);
    setReqLoading(true);
    setProductsLoading(true);
    setReqError(null);
    setProductsError(null);
    Promise.allSettled([
      listInventory({ spaceId: id, page: 1, limit: 50 }),
      listAssetRequests({ spaceId: id, page: 1, limit: 20 }),
      listProducts({ spaceId: id, page: 1, limit: 50 }),
    ]).then(([invRes, reqRes, prodRes]) => {
      if (invRes.status === "fulfilled") {
        const inv = invRes.value;
        const items = inv.data?.items ?? inv.items ?? inv.data ?? inv ?? [];
        setInventory(Array.isArray(items) ? items : []);
      } else {
        setInventory([]);
      }

      if (reqRes.status === "fulfilled") {
        const ar = reqRes.value;
        const items = ar.data?.items ?? ar.items ?? ar.data ?? ar ?? [];
        setRequests(Array.isArray(items) ? items : []);
      } else {
        const err: any = reqRes.reason;
        setRequests([]);
        setReqError(err?.response?.status === 403 ? "not-authorized" : "Failed to load requests.");
      }

      if (prodRes.status === "fulfilled") {
        const res = prodRes.value;
        const payload = res.data ?? res ?? {};
        const items = payload.products ?? payload.items ?? payload.data ?? [];
        setProducts(Array.isArray(items) ? items : []);
      } else {
        setProductsError("Failed to load products.");
        setProducts([]);
      }

      setInvLoading(false);
      setReqLoading(false);
      setProductsLoading(false);
    });
  }, [id]);

  async function loadMembersAndRoles() {
    if (!id || !canManageMembers) {
      setMembers([]);
      setRoles([]);
      setMemberRoleByUserId({});
      return;
    }

    setMembersLoading(true);
    setMembersError(null);
    setRolesLoading(true);
    try {
      const [membersRes, rolesRes, assignmentsRes] = await Promise.all([
        apiClient.get("/space-members?page=1&limit=100", { headers: { "x-space-id": id } }),
        apiClient.get("/roles?page=1&limit=100", { headers: { "x-space-id": id } }),
        apiClient.get("/space-members/user-roles?page=1&limit=100", { headers: { "x-space-id": id } }),
      ]);

      const memberItems = membersRes.data?.data?.items ?? membersRes.data?.data ?? [];
      const roleItems = rolesRes.data?.data?.items ?? rolesRes.data?.data ?? [];
      const assignments = assignmentsRes.data?.data?.items ?? assignmentsRes.data?.data ?? [];
      const byUserId: Record<string, string> = {};
      if (Array.isArray(assignments)) {
        assignments.forEach((a: any) => {
          const uid = String(a?.userId?._id ?? a?.userId ?? "");
          const rid = String(a?.roleId?._id ?? a?.roleId ?? "");
          if (uid && rid) byUserId[uid] = rid;
        });
      }

      setMembers(Array.isArray(memberItems) ? memberItems : []);
      setRoles(Array.isArray(roleItems) ? roleItems : []);
      setMemberRoleByUserId(byUserId);
    } catch (err: any) {
      setMembers([]);
      setRoles([]);
      setMemberRoleByUserId({});
      setMembersError("Failed to load members.");
    } finally {
      setMembersLoading(false);
      setRolesLoading(false);
    }
  }

  useEffect(() => {
    loadMembersAndRoles();
  }, [id, canManageMembers]);

  async function handleChangeMemberRole(userId: string, roleId: string) {
    if (!id || !userId || !roleId) return;
    if (String(currentUserId ?? "") === String(userId)) {
      toast.show("error", "You cannot change your own role.");
      return;
    }
    setUpdatingRoleForUserId(userId);
    try {
      const res = await apiClient.patch(
        "/space-members/user-roles/replace",
        { userId, roleId },
        { headers: { "x-space-id": id } }
      );
      toast.show("success", res.data?.message ?? "Role changed");
      await loadMembersAndRoles();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not change role";
      toast.show("error", msg);
    } finally {
      setUpdatingRoleForUserId(null);
    }
  }

  async function handleDeleteSpace() {
    if (!id) return;

    const ok = await confirm("Delete space", "This will permanently delete the space. Continue?");
    if (!ok) return;

    setDeletingSpace(true);
    try {
      const res = await apiClient.delete(`/spaces/${id}`, { headers: { "x-space-id": id } });
      toast.show("success", res.data?.message ?? "Space deleted");
      router.replace("/spaces");
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not delete space";
      toast.show("error", msg);
    } finally {
      setDeletingSpace(false);
    }
  }

  async function handleSaveDescription() {
    if (!id) return;

    setSavingDescription(true);
    try {
      const res = await apiClient.patch(
        `/spaces/${id}`,
        { description: descriptionDraft.trim() },
        { headers: { "x-space-id": id } }
      );
      const updatedSpace = res.data?.data ?? res.data ?? null;
      if (updatedSpace) {
        setSpace(updatedSpace);
      }
      setEditingDescription(false);
      toast.show("success", res.data?.message ?? "Space description updated");
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not update description";
      toast.show("error", msg);
    } finally {
      setSavingDescription(false);
    }
  }

  useEffect(() => {
    if (!id || !canForwardRequests) {
      setMemberSpaces([]);
      setMemberSpacesError(null);
      return;
    }

    let mounted = true;

    async function loadMemberSpaces() {
      setMemberSpacesLoading(true);
      setMemberSpacesError(null);
      try {
        // Backend validator caps limit at 100 — request a safe default
        const endpoint = isAdminUserType ? "/spaces?page=1&limit=100" : "/spaces/mine?page=1&limit=100";
        const res = await apiClient.get(endpoint);
        const payload = res.data?.data ?? res.data ?? {};
        const items = Array.isArray(payload.items) ? payload.items : payload;
        if (mounted) {
          setMemberSpaces(Array.isArray(items) ? items : []);
        }
      } catch (err: any) {
        if (mounted) {
          setMemberSpaces([]);
          setMemberSpacesError("Failed to load member spaces.");
        }
      } finally {
        if (mounted) {
          setMemberSpacesLoading(false);
        }
      }
    }

    loadMemberSpaces();

    return () => {
      mounted = false;
    };
  }, [id, canForwardRequests, isAdminUserType]);

  useEffect(() => {
    if (!id || !permissionsLoaded) return;
    loadJoinRequests();
  }, [id, permissionsLoaded, canReviewJoinRequests, currentUserId]);

  async function review(requestId: string, action: "APPROVE" | "REJECT") {
    try {
      const ok = await confirm("Confirm review", `Are you sure you want to ${action.toLowerCase()} this request?`);
      if (!ok) return;

      const body: any = { action };
      if (action === "REJECT") {
        const remarksOk = await confirm("Reject remarks", "Provide rejection remarks (OK = generic rejection, Cancel = abort)");
        if (!remarksOk) return;
        body.remarks = "Rejected from UI";
      }

      const res = await apiClient.patch(`/spaces/${id}/join-requests/${requestId}/review`, body, { headers: { "x-space-id": id } });
      toast.show("success", res.data?.message ?? "Reviewed");
      await loadJoinRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not review";
      toast.show("error", msg);
    }
  }

  function openRequestModal(product: any) {
    const productId = product?._id ?? product?.id;
    if (!productId) return;
    setModalProduct(product);
    setModalQty(1);
    setModalNotes("");
    setModalOpen(true);
  }

  async function submitModalRequest() {
    if (!modalProduct) return;
    const productId = modalProduct?._id ?? modalProduct?.id;
    if (!productId) return;
    if (!id) return;

    const available = availableByProductId[productId] ?? 0;
    const requestedQuantity = modalQty ?? 1;

    if (available <= 0) {
      // allow request when out of stock but inform the user
      toast.show("info", "This product is currently out of stock. Your request will be queued.");
    }

    if (available > 0 && requestedQuantity > available) {
      toast.show("error", `Quantity cannot exceed available stock (${available}).`);
      return;
    }

    const businessJustification = (modalNotes ?? "").trim();
    if (!businessJustification) {
      toast.show("error", "Business justification is required.");
      return;
    }

    setModalRequesting(true);
    try {
      const res = await createAssetRequest({ productId, requestedQuantity, businessJustification }, id);
      toast.show("success", res?.message ?? "Request submitted");
      setModalOpen(false);
      setModalProduct(null);
      setModalNotes("");
      await loadRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not submit request";
      toast.show("error", msg);
    } finally {
      setModalRequesting(false);
    }
  }

  function formatUserLabel(userValue: any) {
    if (!userValue) return "Unknown user";
    if (typeof userValue === "string") return userValue;
    const first = userValue.firstName ?? "";
    const last = userValue.lastName ?? "";
    const name = `${first} ${last}`.trim();
    return name || userValue.email || userValue.employeeId || userValue._id || "User";
  }

  function formatProductLabel(productValue: any) {
    if (!productValue) return "Product";
    if (typeof productValue === "string") return productValue;
    return productValue.name ?? productValue.sku ?? productValue.code ?? "Product";
  }

  function formatDate(value?: string | Date | null) {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
  }

  async function handleManagerApprove(request: any) {
    const requestId = request?._id ?? request?.id;
    if (!requestId || !id) return;
    const ok = await confirm("Manager approval", `Approve ${request.requestNumber ?? "this request"}?`);
    if (!ok) return;
    try {
      const res = await managerApproveAssetRequest(requestId, { remarks: "" }, id);
      toast.show("success", res?.message ?? "Approved");
      await loadRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not approve request";
      toast.show("error", msg);
    }
  }

  async function handleItApprove(request: any) {
    const requestId = request?._id ?? request?.id;
    if (!requestId || !id) return;
    const ok = await confirm("IT approval", `Approve ${request.requestNumber ?? "this request"}?`);
    if (!ok) return;
    try {
      const res = await itApproveAssetRequest(requestId, { remarks: "" }, id);
      toast.show("success", res?.message ?? "Approved");
      await loadRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not approve request";
      toast.show("error", msg);
    }
  }

  function openRejectModal(request: any) {
    setRejectingRequest(request);
    setRejectReason("");
    setRejectOpen(true);
  }

  async function submitReject() {
    const requestId = rejectingRequest?._id ?? rejectingRequest?.id;
    if (!requestId || !id) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.show("error", "Rejection reason is required.");
      return;
    }

    setRejectSubmitting(true);
    try {
      const res = await rejectAssetRequest(requestId, { rejectionReason: reason }, id);
      toast.show("success", res?.message ?? "Request rejected");
      setRejectOpen(false);
      setRejectingRequest(null);
      setRejectReason("");
      await loadRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not reject request";
      toast.show("error", msg);
    } finally {
      setRejectSubmitting(false);
    }
  }

  function openForwardModal(request: any) {
    setForwardRequest(request);
    setForwardTargetSpaceId("");
    setForwardOpen(true);
  }

  async function submitForward() {
    const requestId = forwardRequest?._id ?? forwardRequest?.id;
    if (!requestId || !id) return;
    if (!forwardTargetSpaceId) {
      toast.show("error", "Select a target space.");
      return;
    }

    setForwardSubmitting(true);
    try {
      const res = await forwardAssetRequest(requestId, forwardTargetSpaceId, id);
      toast.show("success", res?.message ?? "Request forwarded");
      setForwardOpen(false);
      setForwardRequest(null);
      setForwardTargetSpaceId("");
      await loadRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not forward request";
      toast.show("error", msg);
    } finally {
      setForwardSubmitting(false);
    }
  }

  async function openTransitModal(inventoryItemId: string) {
    if (!id) return;
    setTransitOpen(true);
    setTransitInventoryItemId(inventoryItemId);
    setTransitLoading(true);
    setTransitError(null);

    try {
      const res = await getInventoryItemAuditTrail(inventoryItemId, id);
      const payload = res.data ?? res ?? {};
      const items = payload.data ?? payload.items ?? payload;
      setTransitTransactions(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setTransitError("Failed to load transit details.");
      setTransitTransactions([]);
    } finally {
      setTransitLoading(false);
    }
  }

  const showJoinRequests = canReviewJoinRequests || jrLoading || joinRequests.length > 0;
  const showRequestsSection = canViewAssetRequests || reqLoading || requests.length > 0;
  const forwardSpaces = memberSpaces.filter((spaceItem) => String(spaceItem._id ?? spaceItem.id) !== String(id));
  const showRequestProductsSection = productsLoading || products.length > 0;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-lg sm:p-8">
      {loading && <p className="text-sm text-orange-100">Loading…</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {space && (
        <div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">{space.name}</h1>
              {canUpdateSpace ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-orange-200/60">Description</label>
                    {!editingDescription && (
                      <button
                        type="button"
                        onClick={() => setEditingDescription(true)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                        aria-label="Edit description"
                        title="Edit description"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {!editingDescription ? (
                    <p className="max-w-2xl rounded-md border border-white/10 bg-white/5 p-3 text-sm text-orange-50/80">
                      {space.description || "No description"}
                    </p>
                  ) : (
                    <>
                      <textarea
                        value={descriptionDraft}
                        onChange={(e) => setDescriptionDraft(e.target.value)}
                        rows={4}
                        className="w-full max-w-2xl rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/40"
                        placeholder="Add a description for this space"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          disabled={savingDescription}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingDescription ? "Saving..." : "Save description"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDescriptionDraft(space?.description ?? "");
                            setEditingDescription(false);
                          }}
                          disabled={savingDescription}
                          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-orange-50/80">{space.description || "No description"}</p>
              )}
            </div>
            {canDeleteSpace && (
              <button
                type="button"
                onClick={handleDeleteSpace}
                disabled={deletingSpace}
                className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingSpace ? "Deleting..." : "Delete space"}
              </button>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white">Details</h3>
            <div className="mt-2 text-sm text-white/80">Code: {space.code}</div>
            <div className="mt-2 text-sm text-white/80">Created at: {new Date(space.createdAt).toLocaleString()}</div>
          </div>

          {showJoinRequests && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white">{canReviewJoinRequests ? "Join Requests" : "Your Join Request"}</h3>

              {jrLoading && <p className="text-sm text-orange-100">Loading join requests…</p>}
              {jrError === "not-authorized" && <p className="text-sm text-white/70">You are not allowed to view join requests.</p>}
              {jrError && jrError !== "not-authorized" && <p className="text-sm text-red-300">{jrError}</p>}

              {!jrLoading && joinRequests.length === 0 && canReviewJoinRequests && (
                <p className="text-sm text-orange-100">No join requests for this space.</p>
              )}

              {!jrLoading && joinRequests.length > 0 && (
                <div className="mt-3 space-y-3">
                  {joinRequests.map((r) => {
                    const requester = r.userId ?? r.user ?? r.requestedBy;
                    const requesterLabel = formatUserLabel(requester);

                    return (
                      <div key={r._id ?? r.id} className="rounded-md border border-white/8 p-3 bg-white/3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <div className="text-sm text-white">{requesterLabel}</div>
                            {requester?.email && <div className="text-xs text-orange-50/80">Email: {requester.email}</div>}
                            {requester?.employeeId && <div className="text-xs text-orange-50/80">Employee ID: {requester.employeeId}</div>}
                            <div className="text-xs text-orange-50/80">Status: {r.status ?? "PENDING"}</div>
                            <div className="text-xs text-orange-50/80">Requested: {formatDate(r.createdAt)}</div>
                            {r.message && <div className="text-xs text-orange-50/80">Message: {r.message}</div>}
                            {r.reviewRemarks && <div className="text-xs text-orange-50/80">Review remarks: {r.reviewRemarks}</div>}
                          </div>
                          {canReviewJoinRequests && r.status === "PENDING" && (
                            <div className="flex flex-col gap-2">
                              <button onClick={() => review(r._id ?? r.id, "APPROVE")} className="rounded-md bg-green-600 px-3 py-1 text-sm text-white">Approve</button>
                              <button onClick={() => review(r._id ?? r.id, "REJECT")} className="rounded-md bg-red-600 px-3 py-1 text-sm text-white">Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {canManageMembers && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white">Members</h3>
              {membersLoading && <p className="text-sm text-orange-100">Loading members...</p>}
              {membersError && <p className="text-sm text-red-300">{membersError}</p>}
              {!membersLoading && members.length === 0 && !membersError && <p className="text-sm text-orange-100">No members found.</p>}
              {!membersLoading && members.length > 0 && (
                <div className="mt-3 space-y-3">
                  {members.map((m) => {
                    const memberUser = m.userId ?? {};
                    const uid = String(memberUser._id ?? memberUser.id ?? m.userId);
                    return (
                      <div key={m._id ?? uid} className="rounded-md border border-white/8 bg-white/3 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="text-sm text-white">{formatUserLabel(memberUser)}</div>
                          <div className="flex items-center gap-2">
                            {String(currentUserId ?? "") === String(uid) && (
                              <span className="text-xs text-orange-200/80">Your role cannot be changed here</span>
                            )}
                            <select
                              value={memberRoleByUserId[uid] ?? ""}
                              disabled={rolesLoading || updatingRoleForUserId === uid || String(currentUserId ?? "") === String(uid)}
                              onChange={(e) => handleChangeMemberRole(uid, e.target.value)}
                              className="rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
                            >
                              <option value="">Select role</option>
                              {roles.map((role) => (
                                <option key={role._id ?? role.id} value={role._id ?? role.id} className="bg-slate-900">
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium text-white">Inventory</h3>
            {invLoading ? (
              <p className="text-sm text-orange-100">Loading inventory…</p>
            ) : inventory.length === 0 ? (
              <p className="text-sm text-orange-100">No inventory items for this space.</p>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inventory.map((it) => {
                  const product = it.productId ?? {};
                  const imageUrl = product.imageUrl ?? it.imageUrl;
                  const assignedUser = it.assignedUserId;
                  const warehouse = it.warehouseId;

                  return (
                    <div key={it._id ?? it.id} className="rounded-xl border border-white/10 bg-white/3 p-4">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.name ?? "Product"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">No image</div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-white">{product.name ?? it.name ?? it.title}</div>
                          <div className="text-xs text-orange-200/80">SKU: {product.sku ?? it.sku ?? it.code ?? "-"}</div>
                          <div className="text-xs text-orange-200/80">Qty: {it.quantity ?? it.stock ?? 0}</div>
                          {it.status && <div className="text-xs text-orange-200/80">Status: {it.status}</div>}
                          {it.condition && <div className="text-xs text-orange-200/80">Condition: {it.condition}</div>}
                          {warehouse?.name && (
                            <div className="text-xs text-orange-200/80">Warehouse: {warehouse.name}</div>
                          )}
                          {assignedUser && (
                            <div className="text-xs text-orange-200/80">Assigned: {formatUserLabel(assignedUser)}</div>
                          )}
                          <div className="pt-2">
                            <button
                              type="button"
                              disabled={!product?._id && !product?.id}
                              onClick={() => openRequestModal(product)}
                              className="rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Request inventory
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showRequestProductsSection && (
            <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-medium text-white">Request Products</h3>
            </div>

            {productsLoading && <p className="text-sm text-orange-100">Loading products…</p>}
            {productsError && <p className="text-sm text-red-300">{productsError}</p>}
            {!productsLoading && products.length === 0 && <p className="text-sm text-orange-100">No products found for this space.</p>}

            {products.length > 0 && (
              <div className="mt-3 space-y-3">
                {products.map((product) => {
                  const productId = product?._id ?? product?.id;
                  const available = productId ? availableByProductId[productId] ?? 0 : 0;

                  return (
                    <div key={productId ?? product.name} className="rounded-md bg-white/3 p-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm text-white">{product.name ?? "Product"}</div>
                          <div className="text-xs text-orange-200/80">SKU: {product.sku ?? "-"}</div>
                          <div className="text-xs text-orange-200/80">Available: {available}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!productId}
                            onClick={() => openRequestModal(product)}
                            className="rounded-md bg-orange-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                          >
                            Request
                          </button>
                        </div>
                      </div>
                      {available <= 0 && <p className="mt-1 text-xs text-orange-200/80">Out of stock</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <Modal title={modalProduct ? `Request ${modalProduct.name ?? "product"}` : "Request product"} open={modalOpen} onClose={() => setModalOpen(false)}>
              <div>
                <div className="text-sm text-white">{modalProduct?.name}</div>
                <div className="text-xs text-orange-200/80">SKU: {modalProduct?.sku ?? "-"}</div>
                <div className="mt-3">
                  <label className="text-sm text-white">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={modalProduct ? (availableByProductId[modalProduct._id ?? modalProduct.id] ?? undefined) : undefined}
                    value={modalQty}
                    onChange={(e) => setModalQty(Math.max(1, Number(e.target.value || 1)))}
                    className="mt-1 w-32 rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-sm text-white">Business justification</label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={submitModalRequest}
                    disabled={modalRequesting}
                    className="rounded-md bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {modalRequesting ? "Requesting..." : "Submit request"}
                  </button>
                  <button onClick={() => setModalOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/80 hover:text-white">
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          </div>
          )}

          {showRequestsSection && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white">Requests</h3>
              {reqLoading && <p className="text-sm text-orange-100">Loading requests…</p>}
              {reqError === "not-authorized" && <p className="text-sm text-white/70">You do not have access to view requests.</p>}
              {reqError && reqError !== "not-authorized" && <p className="text-sm text-red-300">{reqError}</p>}
              {!reqLoading && !reqError && requests.length === 0 && <p className="text-sm text-orange-100">No requests for this space.</p>}

              {!reqLoading && requests.length > 0 && (
                <div className="mt-3 space-y-3">
                  {requests.map((r) => {
                    const status = r.status ?? "PENDING";
                    const requester = r.employeeId ?? r.employee ?? r.user;
                    const product = r.productId ?? r.product;
                    const managerApprover = r.managerApprovalBy ?? r.managerApprovedBy;
                    const itApprover = r.itApprovalBy ?? r.itApprovedBy;
                    const inventoryItemId = r.inventoryItemId ?? r.inventoryItem?.id ?? r.inventoryItem?._id;
                    const showManagerApprove = canManagerApprove && status === "PENDING";
                    const showItApprove = canItApprove && status === "MANAGER_APPROVED";
                    const showReject = canReject && (status === "PENDING" || status === "MANAGER_APPROVED");
                    const showForward = canForwardRequests && (status === "PENDING" || status === "MANAGER_APPROVED");

                    return (
                      <div key={r._id ?? r.id} className="rounded-md border border-white/8 bg-white/3 p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <div className="text-sm text-white">{r.requestNumber ?? "Asset request"}</div>
                            <div className="text-xs text-orange-50/80">Product: {formatProductLabel(product)}</div>
                            {product?.sku && <div className="text-xs text-orange-50/80">SKU: {product.sku}</div>}
                            <div className="text-xs text-orange-50/80">Quantity: {r.requestedQuantity ?? 1}</div>
                            <div className="text-xs text-orange-50/80">Priority: {r.priority ?? "MEDIUM"}</div>
                            <div className="text-xs text-orange-50/80">Status: {status}</div>
                            <div className="text-xs text-orange-50/80">
                              Tracking: {status === "PENDING" ? "Manager/Admin approval pending" : status === "MANAGER_APPROVED" ? "IT Team approval pending" : status === "FULFILLED" ? "Approved and fulfilled by IT Team" : status}
                            </div>
                            <div className="text-xs text-orange-50/80">Requested by: {formatUserLabel(requester)}</div>
                            <div className="text-xs text-orange-50/80">Requested at: {formatDate(r.createdAt)}</div>
                            {r.businessJustification && (
                              <div className="text-xs text-orange-50/80">Justification: {r.businessJustification}</div>
                            )}
                            {r.remarks && <div className="text-xs text-orange-50/80">Remarks: {r.remarks}</div>}
                            {managerApprover && (
                              <div className="text-xs text-orange-50/80">Manager approved by: {formatUserLabel(managerApprover)}</div>
                            )}
                            {itApprover && (
                              <div className="text-xs text-orange-50/80">IT approved by: {formatUserLabel(itApprover)}</div>
                            )}
                            {r.managerRemarks && <div className="text-xs text-orange-50/80">Manager remarks: {r.managerRemarks}</div>}
                            {r.itRemarks && <div className="text-xs text-orange-50/80">IT remarks: {r.itRemarks}</div>}
                            {r.rejectionReason && <div className="text-xs text-red-200">Rejection reason: {r.rejectionReason}</div>}
                            {r.managerApprovalAt && <div className="text-xs text-orange-50/80">Manager approved at: {formatDate(r.managerApprovalAt)}</div>}
                            {r.forwardedAt && <div className="text-xs text-orange-50/80">Sent to IT Team queue at: {formatDate(r.forwardedAt)}</div>}
                            {r.itApprovalAt && <div className="text-xs text-orange-50/80">IT approved at: {formatDate(r.itApprovalAt)}</div>}
                            {inventoryItemId && <div className="text-xs text-orange-50/80">Inventory item: {inventoryItemId}</div>}
                            {r.fulfilledAt && <div className="text-xs text-orange-50/80">Fulfilled at: {formatDate(r.fulfilledAt)}</div>}
                          </div>
                          {(showManagerApprove || showItApprove || showReject || showForward || Boolean(inventoryItemId)) && (
                            <div className="flex flex-col gap-2">
                              {showManagerApprove && (
                                <button
                                  onClick={() => handleManagerApprove(r)}
                                  className="rounded-md bg-green-600 px-3 py-1 text-sm text-white"
                                >
                                  Manager approve
                                </button>
                              )}
                              {showItApprove && (
                                <button
                                  onClick={() => handleItApprove(r)}
                                  className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white"
                                >
                                  IT approve
                                </button>
                              )}
                              {showReject && (
                                <button
                                  onClick={() => openRejectModal(r)}
                                  className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                                >
                                  Reject
                                </button>
                              )}
                              {showForward && (
                                <button
                                  onClick={() => openForwardModal(r)}
                                  className="rounded-md bg-purple-600 px-3 py-1 text-sm text-white"
                                >
                                  Forward
                                </button>
                              )}
                              {inventoryItemId && (
                                <button
                                  onClick={() => openTransitModal(inventoryItemId)}
                                  className="rounded-md bg-white/10 px-3 py-1 text-sm text-white"
                                >
                                  View transit
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Modal title="Reject request" open={rejectOpen} onClose={() => setRejectOpen(false)}>
                <div>
                  <p className="text-sm text-white">Provide a rejection reason.</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={submitReject}
                      disabled={rejectSubmitting}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {rejectSubmitting ? "Rejecting..." : "Reject"}
                    </button>
                    <button onClick={() => setRejectOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/80 hover:text-white">
                      Cancel
                    </button>
                  </div>
                </div>
              </Modal>

              <Modal title="Forward request" open={forwardOpen} onClose={() => setForwardOpen(false)}>
                <div>
                  <p className="text-sm text-white">Select a target space you belong to.</p>
                  {memberSpacesLoading && <p className="mt-2 text-sm text-orange-100">Loading spaces…</p>}
                  {memberSpacesError && <p className="mt-2 text-sm text-red-300">{memberSpacesError}</p>}
                  {!memberSpacesLoading && forwardSpaces.length === 0 && (
                    <p className="mt-2 text-sm text-orange-100">No other member spaces available.</p>
                  )}
                  {!memberSpacesLoading && forwardSpaces.length > 0 && (
                    <select
                      value={forwardTargetSpaceId}
                      onChange={(e) => setForwardTargetSpaceId(e.target.value)}
                      className="mt-3 w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
                    >
                      <option value="">Select a space</option>
                      {forwardSpaces.map((spaceItem) => (
                        <option key={spaceItem._id ?? spaceItem.id} value={spaceItem._id ?? spaceItem.id} className="bg-slate-900">
                          {spaceItem.name} ({spaceItem.code ?? ""})
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={submitForward}
                      disabled={forwardSubmitting || forwardSpaces.length === 0}
                      className="rounded-md bg-purple-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {forwardSubmitting ? "Forwarding..." : "Forward"}
                    </button>
                    <button onClick={() => setForwardOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/80 hover:text-white">
                      Cancel
                    </button>
                  </div>
                </div>
              </Modal>

              <Modal title="Transit details" open={transitOpen} onClose={() => setTransitOpen(false)}>
                <div>
                  {transitInventoryItemId && (
                    <p className="text-xs text-orange-50/80">Inventory item: {transitInventoryItemId}</p>
                  )}
                  {transitLoading && <p className="mt-2 text-sm text-orange-100">Loading transit details…</p>}
                  {transitError && <p className="mt-2 text-sm text-red-300">{transitError}</p>}
                  {!transitLoading && !transitError && transitTransactions.length === 0 && (
                    <p className="mt-2 text-sm text-orange-100">No transit activity found.</p>
                  )}
                  {!transitLoading && transitTransactions.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {transitTransactions.map((t) => (
                        <div key={t._id ?? t.id} className="rounded-md border border-white/8 bg-white/3 p-3">
                          <div className="text-sm text-white">{t.transactionType ?? "Transaction"}</div>
                          <div className="text-xs text-orange-50/80">Performed by: {formatUserLabel(t.performedBy)}</div>
                          <div className="text-xs text-orange-50/80">Date: {formatDate(t.transactionDate)}</div>
                          <div className="text-xs text-orange-50/80">Status: {t.previousStatus} → {t.newStatus}</div>
                          {t.remarks && <div className="text-xs text-orange-50/80">Remarks: {t.remarks}</div>}
                          {t.fromWarehouseId && <div className="text-xs text-orange-50/80">From warehouse: {t.fromWarehouseId}</div>}
                          {t.toWarehouseId && <div className="text-xs text-orange-50/80">To warehouse: {t.toWarehouseId}</div>}
                          {t.fromUserId && <div className="text-xs text-orange-50/80">From user: {t.fromUserId}</div>}
                          {t.toUserId && <div className="text-xs text-orange-50/80">To user: {t.toUserId}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Modal>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
