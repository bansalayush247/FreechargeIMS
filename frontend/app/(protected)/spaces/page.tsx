"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../../src/lib/api";
import { logger } from "../../../src/lib/logger";
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
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openJoin, setOpenJoin] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    async function fetchSpaces() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get("/spaces");
        const list = res.data?.data ?? res.data ?? [];

        if (!mounted) return;
        setSpaces(Array.isArray(list) ? list : []);
        logger.info("Fetched spaces list", { count: Array.isArray(list) ? list.length : 0 });
      } catch (err) {
        logger.warn("Failed to fetch spaces", { error: String(err) });
        setError("Unable to load spaces. Try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSpaces();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleOpenJoin(spaceId: string) {
    setOpenJoin((s) => ({ ...s, [spaceId]: !s[spaceId] }));
  }

  async function handleSubmitJoin(spaceId: string) {
    const message = messages[spaceId] ?? "I'd like to join this space.";
    setSubmitting((s) => ({ ...s, [spaceId]: true }));

    try {
      const res = await apiClient.post(`/spaces/${spaceId}/join-requests`, { message });
      logger.info("Join request submitted", { spaceId, userId: user?.id ?? user?._id });
      // optimistic UI: close form and show toast via simple alert for now
      setOpenJoin((s) => ({ ...s, [spaceId]: false }));
      // show success using window.alert to keep things simple for now
      alert(res.data?.message ?? "Join request submitted");
    } catch (err: any) {
      const msg = (err?.response?.data?.message as string) ?? err?.message ?? "Could not submit join request.";
      logger.warn("Join request failed", { spaceId, message: msg });
      alert(msg);
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
                    <button
                      onClick={() => handleOpenJoin(space._id ?? space.id)}
                      className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white hover:bg-orange-600"
                    >
                      Request to join
                    </button>
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
      </div>
    </section>
  );
}
