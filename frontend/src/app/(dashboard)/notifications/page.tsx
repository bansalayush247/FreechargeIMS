"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listNotifications } from "@/src/lib/notificationClient";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function NotificationsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", activeSpaceId],
    queryFn: () => listNotifications({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }),
  });

  const notifications = getItems(data) as Array<{ _id?: string; id?: string; subject?: string; body?: string; status?: string; channel?: string; recipientEmail?: string }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Notifications" description="Operational alerts for requests, approvals, fulfillments, and membership changes." />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to scope notifications.</div>
          ) : isLoading ? (
            <div className="grid gap-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Notifications could not be loaded right now.</div>
          ) : notifications.length ? notifications.map((notification) => (
            <div key={notification._id || notification.id} className="rounded-2xl border border-orange-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{notification.subject || "Notification"}</p>
                  <p className="text-sm text-slate-600">{notification.body || "No message body"}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{notification.status || "UNKNOWN"}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{notification.channel || "channel"}{notification.recipientEmail ? ` · ${notification.recipientEmail}` : ""}</p>
            </div>
          )) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No notifications found for this space.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}