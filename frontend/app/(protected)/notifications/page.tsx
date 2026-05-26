"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../src/auth/authContext";
import { logger } from "../../../src/lib/logger";
import {
  listNotifications,
  type NotificationItem,
} from "../../../src/lib/notificationClient";

const PAGE_LIMIT = 10;

const STATUS_FILTERS = ["ALL", "PENDING", "SENT", "FAILED", "SKIPPED"] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status?: string) {
  switch (status) {
    case "SENT":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "FAILED":
      return "border-rose-400/30 bg-rose-500/10 text-rose-100";
    case "SKIPPED":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-sky-400/30 bg-sky-500/10 text-sky-100";
  }
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
  const recipientName = [
    notification.recipientUserId?.firstName,
    notification.recipientUserId?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/35 p-5 shadow-lg shadow-black/10 backdrop-blur-sm transition hover:border-white/20 hover:bg-slate-950/45">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(notification.status)}`}>
              {notification.status}
            </span>
            {notification.type ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-orange-100/70">
                {notification.type}
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 text-lg font-semibold text-white">{notification.subject}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-orange-50/78">
            {notification.body}
          </p>
        </div>

        <div className="shrink-0 text-sm text-orange-50/65 sm:text-right">
          <p>{formatDate(notification.createdAt)}</p>
          {notification.sentAt ? <p className="mt-1">Sent {formatDate(notification.sentAt)}</p> : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-orange-200/60">Recipient</dt>
          <dd className="mt-1 text-white">{recipientName || notification.recipientEmail || "Unknown"}</dd>
        </div>
        <div>
          <dt className="text-orange-200/60">Email</dt>
          <dd className="mt-1 break-all text-white">{notification.recipientEmail || "-"}</dd>
        </div>
        <div>
          <dt className="text-orange-200/60">Channel</dt>
          <dd className="mt-1 text-white">{notification.channel || "EMAIL"}</dd>
        </div>
        <div>
          <dt className="text-orange-200/60">Space</dt>
          <dd className="mt-1 text-white">{notification.spaceId || "Personal"}</dd>
        </div>
      </dl>

      {notification.errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {notification.errorMessage}
        </div>
      ) : null}
    </article>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [pagination, setPagination] = useState<{ page: number; totalPages: number; total: number } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchNotifications() {
      setLoading(true);
      setError(null);

      try {
        const res = await listNotifications({
          page,
          limit: PAGE_LIMIT,
          status: status === "ALL" ? undefined : status,
        });

        const payload = res?.data ?? res ?? {};
        const items = Array.isArray(payload.items) ? payload.items : [];

        if (!mounted) {
          return;
        }

        setNotifications(items);
        setPagination(
          payload.pagination
            ? {
                page: payload.pagination.page,
                totalPages: payload.pagination.totalPages,
                total: payload.pagination.total,
              }
            : null,
        );
      } catch (fetchError) {
        if (!mounted) {
          return;
        }

        logger.error("Failed to load notifications", { error: String(fetchError) });
        setError("Unable to load your notifications right now.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, [page, status]);

  const visibleCount = useMemo(() => notifications.length, [notifications]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-lg sm:p-8">
      <p className="text-sm uppercase tracking-[0.24em] text-orange-200/70">Protected route</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Notifications</h1>
          <p className="mt-2 max-w-2xl text-orange-50/80">
            Your personal notification feed. These entries are scoped to your account, not to a space membership.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-orange-50/70">
          <div className="font-medium text-white">{user?.email ?? user?.name ?? "Current user"}</div>
          <div className="mt-1">{visibleCount} items on this page</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => {
          const active = item === status;

          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-[#ff6b35]/40 bg-[#ff6b35] text-white shadow-lg shadow-orange-500/20"
                  : "border-white/10 bg-white/5 text-orange-50/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="animate-pulse rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                <div className="h-5 w-32 rounded bg-white/10" />
                <div className="mt-4 h-6 w-2/3 rounded bg-white/10" />
                <div className="mt-3 h-4 w-full rounded bg-white/10" />
                <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </div>
        ) : notifications.length ? (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/25 p-10 text-center text-orange-50/70">
            No notifications yet. When activity happens, it will show up here.
          </div>
        )}
      </div>

      {pagination ? (
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-orange-50/65">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total notifications
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-orange-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-orange-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}