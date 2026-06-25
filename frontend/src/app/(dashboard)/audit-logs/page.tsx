"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { listAuditLogs } from "@/src/lib/auditLogClient";
import { getApiItems } from "@/src/lib/api-data";

type Actor = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type AuditLog = {
  id?: string;
  _id?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  createdAt?: string;
  actorId?: Actor | string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
};

function readable(value?: string) {
  return value ? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
}

function actorLabel(actor?: Actor | string) {
  if (!actor) return "Unknown user";
  if (typeof actor === "string") return actor;
  return [actor.firstName, actor.lastName].filter(Boolean).join(" ") || actor.email || "Unknown user";
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AuditLogsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", activeSpaceId],
    queryFn: () => listAuditLogs({ page: 1, limit: 50 }),
  });

  const items = getApiItems<AuditLog>(data);
  const visibleItems = items.filter((item) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;

    return [
      item.action,
      item.entityType,
      item.entityId,
      actorLabel(item.actorId),
      item.ipAddress,
    ].filter(Boolean).join(" ").toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Audit Logs" title="Activity history" description="Search and filter entity/user activity." />
      <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search loaded logs" />
      <Card>
        <CardContent className="space-y-3 p-6">
          {isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Audit logs could not be loaded.</div>
          ) : visibleItems.length ? (
            visibleItems.map((item) => (
              <div key={item.id || item._id} className="rounded-2xl border border-orange-100 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{readable(item.action) || "Activity"} · {readable(item.entityType) || "Entity"}</p>
                    <p className="text-sm text-slate-600">By {actorLabel(item.actorId)}</p>
                  </div>
                  {item.createdAt ? <p className="text-sm text-slate-500">{formatDate(item.createdAt)}</p> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {item.entityId ? <span>Entity ID: {item.entityId}</span> : null}
                  {item.ipAddress ? <span>IP: {item.ipAddress}</span> : null}
                  {item.metadata && Object.keys(item.metadata).length ? <span>Metadata: {Object.keys(item.metadata).join(", ")}</span> : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No audit logs found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
