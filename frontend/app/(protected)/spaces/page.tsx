"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../../src/lib/api";
import { logger } from "../../../src/lib/logger";
import { useToast } from "../../../src/components/toastProvider";
import { useAuth } from "../../../src/auth/authContext";

type Space = {
  _id: string;
  id?: string;
  name: string;
  code?: string;
  description?: string;
  [key: string]: any;
};

export default function SpacesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [memberIds, setMemberIds] = useState<Record<string, true>>({});
  const [minePage, setMinePage] = useState(1);
  const PAGE_LIMIT = 6;
  const [minePagination, setMinePagination] = useState<{ page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openJoin, setOpenJoin] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const toast = useToast();

  useEffect(() => {
    let mounted = true;

    async function fetchSpaces() {
      setLoading(true);
      setError(null);

      try {
        const endpoint = tab === "mine" ? `/spaces/mine?page=${minePage}&limit=${PAGE_LIMIT}` : "/spaces";
        const res = await apiClient.get(endpoint);
        const payload = res.data?.data ?? res.data ?? {};
        const list = Array.isArray(payload.items) ? payload.items : payload;
        if (tab === "mine" && payload.pagination) {
          setMinePagination({ page: payload.pagination.page, totalPages: payload.pagination.totalPages });
        }

        if (!mounted) return;
        setSpaces(Array.isArray(list) ? list : []);
        logger.info("Fetched spaces list", { count: Array.isArray(list) ? list.length : 0, tab });
      } catch (err) {
        logger.warn("Failed to fetch spaces", { error: String(err), tab });
        setError("Unable to load spaces. Try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSpaces();

    // fetch membership IDs once to mark joined spaces (for All tab)
    async function fetchMembershipIds() {
      try {
        const res = await apiClient.get("/spaces/mine?page=1&limit=1000");
        const payload = res.data?.data ?? res.data ?? {};
        const items = Array.isArray(payload.items) ? payload.items : payload;
        const ids: Record<string, true> = {};
        for (const s of items) ids[s._id ?? s.id] = true;
        setMemberIds(ids);
      } catch (e) {
        // ignore
      }
    }

    fetchMembershipIds();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // refetch when tab changes
    const controller = new AbortController();
    let mounted = true;

    async function refetch() {
      setLoading(true);
      setError(null);

      try {
        const endpoint = tab === "mine" ? `/spaces/mine?page=${minePage}&limit=${PAGE_LIMIT}` : "/spaces";
        const res = await apiClient.get(endpoint, { signal: controller.signal as any });
        const payload = res.data?.data ?? res.data ?? {};
        const list = Array.isArray(payload.items) ? payload.items : payload;
        if (tab === "mine" && payload.pagination) {
          setMinePagination({ page: payload.pagination.page, totalPages: payload.pagination.totalPages });
        }

        if (!mounted) return;
        setSpaces(Array.isArray(list) ? list : []);
      } catch (err) {
        if ((err as any)?.name === "CanceledError") return;
        setError("Unable to load spaces. Try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    refetch();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [tab]);

  useEffect(() => {
    // re-run fetch when minePage changes while in mine tab
    if (tab !== "mine") return;

    const controller = new AbortController();
    let mounted = true;

    (async function () {
      setLoading(true);
      try {
        const res = await apiClient.get(`/spaces/mine?page=${minePage}&limit=${PAGE_LIMIT}`, { signal: controller.signal as any });
        const payload = res.data?.data ?? res.data ?? {};
        const list = Array.isArray(payload.items) ? payload.items : payload;
        if (payload.pagination) {
          setMinePagination({ page: payload.pagination.page, totalPages: payload.pagination.totalPages });
        }
        if (!mounted) return;
        setSpaces(Array.isArray(list) ? list : []);
      } catch (err) {
        if ((err as any)?.name === "CanceledError") return;
        setError("Unable to load spaces. Try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [minePage, tab]);

  async function handleOpenJoin(spaceId: string) {
    setOpenJoin((s) => ({ ...s, [spaceId]: !s[spaceId] }));
  }

  async function handleSubmitJoin(spaceId: string) {
    const message = messages[spaceId] ?? "I'd like to join this space.";
    setSubmitting((s) => ({ ...s, [spaceId]: true }));

    try {
      const res = await apiClient.post(`/spaces/${spaceId}/join-requests`, { message });
      logger.info("Join request submitted", { spaceId, userId: user?.id ?? user?._id });
      setOpenJoin((s) => ({ ...s, [spaceId]: false }));
      toast.show("success", res.data?.message ?? "Join request submitted");
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not submit join request.";
      logger.warn("Join request failed", { spaceId, message: msg });
      toast.show("error", msg);
    } finally {
      setSubmitting((s) => ({ ...s, [spaceId]: false }));
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-lg sm:p-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-orange-200/70">Protected route</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Spaces</h1>
          <p className="mt-2 max-w-2xl text-orange-50/80">Browse available spaces and request to join.</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${tab === "all" ? "bg-white/8 text-white" : "text-white/80"}`}
          >
            All spaces
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${tab === "mine" ? "bg-white/8 text-white" : "text-white/80"}`}
          >
            My spaces
          </button>
          <div className="ml-auto">
            <button
              onClick={() => setCreateOpen((s) => !s)}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create space
            </button>
          </div>
        </div>
        {createOpen && (
          <div className="mb-4 rounded-md border border-white/6 bg-white/3 p-4">
            <div className="flex flex-col gap-2">
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Space name"
                className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
              />
              <input
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
                placeholder="Space code (optional, e.g. FC_DEV)"
                className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
              />
              <div className="flex gap-2">
                <button
                  disabled={creating || !createName.trim()}
                      onClick={async () => {
                    setCreating(true);
                    try {
                      const payload: any = { name: createName.trim() };
                      if (createCode.trim()) payload.code = createCode.trim();
                      const res = await apiClient.post("/spaces", payload);
                      toast.show("success", res.data?.message ?? "Space created");
                      // After create, switch to My spaces and refresh
                      setCreateOpen(false);
                      setCreateName("");
                      setCreateCode("");
                      setTab("mine");
                      setMinePage(1);
                      // refresh membership ids and spaces
                      try {
                        const mem = await apiClient.get(`/spaces/mine?page=1&limit=${PAGE_LIMIT}`);
                        const payload = mem.data?.data ?? mem.data ?? {};
                        const items = Array.isArray(payload.items) ? payload.items : payload;
                        const ids: Record<string, true> = {};
                        for (const s of items) ids[s._id ?? s.id] = true;
                        setMemberIds(ids);
                        setSpaces(Array.isArray(items) ? items : []);
                      } catch (e) {
                        // ignore
                      }
                      } catch (err: any) {
                      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not create space.";
                      toast.show("error", msg);
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
                <button onClick={() => setCreateOpen(false)} className="rounded-md px-3 py-1 text-sm font-medium text-white/80 hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {loading && <p className="text-sm text-orange-100">Loading spaces…</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}

        {!loading && !error && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <div key={space._id ?? space.id} className="rounded-xl border border-white/6 bg-white/3 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{space.name}</h2>
                    <p className="text-sm text-orange-50/80">{space.description || "No description"}</p>
                  </div>
                  <div>
                    {memberIds[space._id ?? space.id] ? (
                      <span className="rounded-md px-3 py-1 text-sm font-medium text-white/80">Member</span>
                    ) : (
                      <button
                        onClick={() => handleOpenJoin(space._id ?? space.id)}
                        className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white hover:bg-orange-600"
                      >
                        Request to join
                      </button>
                    )}
                  </div>
                </div>

                {openJoin[space._id ?? space.id] && (
                  <div className="mt-3">
                    <textarea
                      value={messages[space._id ?? space.id] ?? ""}
                      onChange={(e) => setMessages((m) => ({ ...m, [space._id ?? space.id]: e.target.value }))}
                      placeholder="Optional message to the space admins"
                      className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white placeholder:text-orange-200/50"
                      rows={3}
                    />

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        disabled={Boolean(submitting[space._id ?? space.id])}
                        onClick={() => handleSubmitJoin(space._id ?? space.id)}
                        className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {submitting[space._id ?? space.id] ? "Sending…" : "Send request"}
                      </button>
                      <button
                        onClick={() => setOpenJoin((s) => ({ ...s, [space._id ?? space.id]: false }))}
                        className="rounded-md px-3 py-1 text-sm font-medium text-white/80 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {tab === "mine" && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setMinePage((p) => Math.max(1, p - 1))}
              disabled={minePagination ? minePagination.page <= 1 : minePage <= 1}
              className="rounded-md px-3 py-1 bg-white/6 text-sm text-white disabled:opacity-50"
            >
              Previous
            </button>
            <div className="text-sm text-white/80">
              Page {minePagination ? minePagination.page : minePage} of {minePagination ? minePagination.totalPages : "?"}
            </div>
            <button
              onClick={() => setMinePage((p) => p + 1)}
              disabled={minePagination ? minePagination.page >= minePagination.totalPages : false}
              className="rounded-md px-3 py-1 bg-white/6 text-sm text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
