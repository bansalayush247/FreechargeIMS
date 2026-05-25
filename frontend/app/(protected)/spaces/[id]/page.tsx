"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "../../../../src/lib/api";
import { logger } from "../../../../src/lib/logger";
import { useToast } from "../../../../src/components/toastProvider";
import { Modal } from "../../../../src/components/modal";
import { useConfirm } from "../../../../src/components/confirmProvider";
import { listInventory } from "../../../../src/lib/inventoryClient";
import { createAssetRequest, listAssetRequests } from "../../../../src/lib/assetRequestClient";
import { listProducts } from "../../../../src/lib/productClient";

export default function SpaceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

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
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [requestQty, setRequestQty] = useState<Record<string, number>>({});
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});
  const [requesting, setRequesting] = useState<Record<string, boolean>>({});
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<any | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalNotes, setModalNotes] = useState<string>("");
  const [modalRequesting, setModalRequesting] = useState(false);
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

  async function loadJoinRequests() {
    setJrLoading(true);
    setJrError(null);
    try {
      const res = await apiClient.get(`/spaces/${id}/join-requests`, { headers: { "x-space-id": id } });
      const payload = res.data?.data ?? res.data ?? {};
      const items = Array.isArray(payload.items) ? payload.items : payload;
      setJoinRequests(Array.isArray(items) ? items : []);
    } catch (err: any) {
      // If 403, means current user is not an admin for this space — hide admin panel silently
      if (err?.response?.status === 403) {
        setJoinRequests([]);
        setJrError("not-authorized");
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
    try {
      const ar = await listAssetRequests({ spaceId: id, page: 1, limit: 20 });
      const items = ar.data?.items ?? ar.items ?? ar.data ?? ar ?? [];
      setRequests(Array.isArray(items) ? items : []);
    } catch (err: any) {
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
      setProductsLoaded(true);
    } catch (err: any) {
      setProductsError("Failed to load products.");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    loadJoinRequests();
    loadInventory();
    loadRequests();
    loadProducts();
  }, [id]);

  function updateRequestedQuantity(productId: string, value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const available = availableByProductId[productId] ?? 0;
    const max = available > 0 ? available : 1;
    const clamped = Math.max(1, Math.min(parsed, max));
    setRequestQty((prev) => ({ ...prev, [productId]: clamped }));
  }

  async function submitRequest(product: any) {
    const productId = product?._id ?? product?.id;
    if (!productId) return;
    if (!id) return;
    const available = availableByProductId[productId] ?? 0;
    if (available <= 0) {
      toast.show("error", "No available quantity for this product.");
      return;
    }

    const requestedQuantity = requestQty[productId] ?? 1;
    if (requestedQuantity > available) {
      toast.show("error", `Quantity cannot exceed available stock (${available}).`);
      return;
    }

    const businessJustification = (requestNotes[productId] ?? "").trim();
    if (!businessJustification) {
      toast.show("error", "Business justification is required.");
      return;
    }

    setRequesting((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await createAssetRequest(
        { productId, requestedQuantity, businessJustification },
        id
      );
      toast.show("success", res?.message ?? "Request submitted");
      setRequestNotes((prev) => ({ ...prev, [productId]: "" }));
      await loadRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not submit request";
      toast.show("error", msg);
    } finally {
      setRequesting((prev) => ({ ...prev, [productId]: false }));
    }
  }

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
    const available = availableByProductId[productId] ?? 1;
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
    if (available <= 0) {
      toast.show("error", "No available quantity for this product.");
      return;
    }

    const requestedQuantity = modalQty ?? 1;
    if (requestedQuantity > available) {
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

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-lg sm:p-8">
      {loading && <p className="text-sm text-orange-100">Loading…</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {space && (
        <div>
          <h1 className="text-2xl font-semibold text-white">{space.name}</h1>
          <p className="text-sm text-orange-50/80 mt-2">{space.description || "No description"}</p>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white">Details</h3>
            <div className="mt-2 text-sm text-white/80">Code: {space.code}</div>
            <div className="mt-2 text-sm text-white/80">Created at: {new Date(space.createdAt).toLocaleString()}</div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-white">Join Requests (admin only)</h3>

            {jrLoading && <p className="text-sm text-orange-100">Loading join requests…</p>}
            {jrError === "not-authorized" && <p className="text-sm text-white/70">You are not a space admin.</p>}
            {jrError && jrError !== "not-authorized" && <p className="text-sm text-red-300">{jrError}</p>}

            {!jrLoading && joinRequests.length > 0 && (
              <div className="mt-3 space-y-3">
                {joinRequests.map((r) => (
                  <div key={r._id ?? r.id} className="rounded-md border border-white/8 p-3 bg-white/3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-white">{r.user?.firstName ?? r.user?.email ?? r.user}</div>
                        <div className="text-xs text-orange-50/80">{r.message}</div>
                        <div className="text-xs text-white/60">Requested: {new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => review(r._id ?? r.id, "APPROVE")} className="rounded-md bg-green-600 px-3 py-1 text-sm text-white">Approve</button>
                        <button onClick={() => review(r._id ?? r.id, "REJECT")} className="rounded-md bg-red-600 px-3 py-1 text-sm text-white">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-white">Inventory</h3>
            {invLoading ? (
              <p className="text-sm text-orange-100">Loading inventory…</p>
            ) : inventory.length === 0 ? (
              <p className="text-sm text-orange-100">No inventory items for this space.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {inventory.map((it) => (
                  <div key={it._id ?? it.id} className="rounded-md bg-white/3 p-2">
                    <div className="text-sm text-white">{it.productId?.name ?? it.name ?? it.title}</div>
                    <div className="text-xs text-orange-200/80">SKU: {it.productId?.sku ?? it.sku ?? it.code ?? "-"}</div>
                    <div className="text-xs text-orange-200/80">Qty: {it.quantity ?? it.stock ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                            disabled={!productId || available <= 0}
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
                    max={modalProduct ? (availableByProductId[modalProduct._id ?? modalProduct.id] ?? 1) : 1}
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

          <div className="mt-6">
            <h3 className="text-lg font-medium text-white">Requests</h3>
            {reqLoading ? (
              <p className="text-sm text-orange-100">Loading requests…</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-orange-100">No requests for this space.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {requests.map((r) => (
                  <div key={r._id ?? r.id} className="rounded-md bg-white/3 p-2">
                    <div className="text-sm text-white">{r.title ?? r.itemName ?? "Request"}</div>
                    <div className="text-xs text-orange-200/80">{r.status ?? r.state ?? "pending"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
