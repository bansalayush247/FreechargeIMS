"use client";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { cancelRepair, completeRepair, getRepair } from "@/src/lib/repairClient";
export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({ queryKey: ["repair", id], queryFn: () => getRepair(id), enabled: Boolean(id) });
  const complete = useMutation({ mutationFn: () => completeRepair(id) });
  const cancel = useMutation({ mutationFn: () => cancelRepair(id) });
  return <div className="space-y-4"><PageHeader eyebrow="Repairs" title={`Repair ${id}`} description="Detail, timeline, and transition actions." />
    <pre className="text-xs border rounded p-3 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    <div className="flex gap-2"><Button onClick={() => complete.mutate()}>Complete</Button><Button variant="outline" onClick={() => cancel.mutate()}>Cancel</Button></div>
  </div>;
}
