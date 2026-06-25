"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { buttonVariants } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Authorize } from "@/src/components/auth/Authorize";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";
import { getApiItems } from "@/src/lib/api-data";
import { listNotifications } from "@/src/lib/notificationClient";

type Recipient = {
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
};

type Notification = {
  _id?: string;
  id?: string;
  subject?: string;
  body?: string;
  status?: string;
  channel?: string;
  type?: string;
  recipientEmail?: string;
  recipientUserId?: Recipient | null;
  createdAt?: string;
  sentAt?: string | null;
  errorMessage?: string;
};

function recipientLabel(notification: Notification) {
  const user = notification.recipientUserId;
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  return name || user?.email || notification.recipientEmail || "No recipient";
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", activeSpaceId],
    queryFn: () => listNotifications({ spaceId: activeSpaceId ?? undefined, page: 1, limit: 50 }),
    enabled: Boolean(activeSpaceId),
  });

  const notifications = getApiItems<Notification>(data);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="Operational alerts for requests, approvals, fulfillments, and membership changes."
        actions={
          <Authorize permission={BACKEND_PERMISSIONS.SEND_NOTIFICATION}>
            <Link href="/notifications/send" className={buttonVariants()}>
              Send notification
            </Link>
          </Authorize>
        }
      />
      <Card>
        <CardContent className="space-y-3 p-6">
          {!activeSpaceId ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to scope notifications.</div>
          ) : isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Notifications could not be loaded right now.</div>
          ) : notifications.length ? (
            notifications.map((notification) => (
              <div key={notification._id || notification.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{notification.subject || "Notification"}</p>
                    <p className="text-sm text-slate-600">{notification.body || "No message body"}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">{notification.status || "UNKNOWN"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{notification.channel || "channel"} · {notification.type || "type"}</span>
                  <span>To: {recipientLabel(notification)}</span>
                  {notification.sentAt ? <span>Sent: {formatDate(notification.sentAt)}</span> : notification.createdAt ? <span>Created: {formatDate(notification.createdAt)}</span> : null}
                </div>
                {notification.errorMessage ? <p className="mt-2 text-xs text-rose-600">{notification.errorMessage}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No notifications found for this space.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
