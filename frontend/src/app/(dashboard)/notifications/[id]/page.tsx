"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { getNotification } from "@/src/lib/notificationClient";
export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({ queryKey: ["notification", id], queryFn: () => getNotification(id), enabled: Boolean(id) });
  return <div className="space-y-4"><PageHeader eyebrow="Notifications" title={`Notification ${id}`} description="Notification detail view." /><pre className="border rounded p-3 text-xs">{JSON.stringify(data, null, 2)}</pre></div>;
}
