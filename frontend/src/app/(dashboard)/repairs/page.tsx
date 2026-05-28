"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { listRepairs } from "@/src/lib/repairClient";
import { Badge } from "@/src/components/ui/badge";
export default function RepairsPage() {
  const { data = [] } = useQuery({ queryKey: ["repairs"], queryFn: listRepairs });
  return <div className="space-y-4"><PageHeader eyebrow="Repairs" title="Repair requests" description="Track repair lifecycles with status and history." actions={<Link href="/repairs/create">Create</Link>} />
    {(data as Array<{ id?: string; _id?: string; title?: string; status?: string; cost?: number }>).map((r) => <Link key={r.id || r._id} href={`/repairs/${r.id || r._id}`} className="block border rounded-xl p-3">{r.title || "Repair"} <Badge>{r.status || "open"}</Badge> <span className="text-sm">Cost: {r.cost ?? 0}</span></Link>)}
  </div>;
}
