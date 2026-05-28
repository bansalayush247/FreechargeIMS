"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Input } from "@/src/components/ui/input";
import { listAuditLogs } from "@/src/lib/auditLogClient";
export default function AuditLogsPage() {
  const [q, setQ] = useState("");
  const { data } = useQuery({ queryKey: ["audit-logs", q], queryFn: () => listAuditLogs({ search: q, page: 1, limit: 20 }) });
  const items = data?.items ?? [];
  return <div className="space-y-4"><PageHeader eyebrow="Audit Logs" title="Activity history" description="Search and filter entity/user activity." /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs" />
    <div className="space-y-2">{items.map((item: { id?: string; _id?: string; action?: string; entity?: string; createdAt?: string }) => <div key={item.id || item._id} className="border rounded p-3 text-sm">{item.action} on {item.entity} at {item.createdAt}</div>)}</div>
  </div>;
}
