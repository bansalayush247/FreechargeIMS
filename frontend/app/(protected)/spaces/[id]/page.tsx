"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "../../../../src/lib/api";
import { logger } from "../../../../src/lib/logger";
import { useAuth } from "../../../../src/auth/authContext";

export default function SpaceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [space, setSpace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [jrLoading, setJrLoading] = useState(false);
  const [jrError, setJrError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!id) return;
    loadJoinRequests();
  }, [id]);

  async function review(requestId: string, action: "APPROVE" | "REJECT") {
    try {
      const body: any = { action };
      if (action === "REJECT") body.remarks = "Rejected from UI";
      const res = await apiClient.patch(`/spaces/${id}/join-requests/${requestId}/review`, body, { headers: { "x-space-id": id } });
      alert(res.data?.message ?? "Reviewed");
      await loadJoinRequests();
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not review";
      alert(msg);
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
        </div>
      )}
    </section>
  );
}
