"use client";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { deleteWarehouse, getWarehouse } from "@/src/features/warehouses/api";
export default function StorageLocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({ queryKey: ["warehouse", id], queryFn: () => getWarehouse(id), enabled: Boolean(id) });
  const remove = useMutation({ mutationFn: () => deleteWarehouse(id) });
  return <div className="space-y-4"><PageHeader eyebrow="Storage locations" title={`Storage location ${id}`} description="Storage location details and actions." /><pre className="border rounded p-3 text-xs">{JSON.stringify(data, null, 2)}</pre><Button variant="outline" onClick={() => remove.mutate()}>Delete storage location</Button></div>;
}
