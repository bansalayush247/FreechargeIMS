"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { listNotifications } from "@/src/lib/notificationClient";

export default function NotificationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications({ limit: 20 }),
  });

  const items = data?.items ?? data?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Activity notifications"
        description="A reusable list and detail pattern now shows live workflow updates and alerts."
      />

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <CardContent className="p-6 text-sm">Notifications could not be loaded.</CardContent>
        </Card>
      ) : items.length ? (
        <div className="grid gap-4">
          {items.map((notification: { _id?: string; subject?: string; body?: string; status?: string; createdAt?: string }) => (
            <Card key={notification._id || notification.subject}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{notification.subject || "Untitled notification"}</CardTitle>
                    <CardDescription>{notification.status || "pending"}</CardDescription>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-brand">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Recent"}</span>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{notification.body || "No message provided."}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-slate-300">No notifications yet.</CardContent>
        </Card>
      )}
    </div>
  );
}