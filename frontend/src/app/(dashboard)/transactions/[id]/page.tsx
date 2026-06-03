"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { getInventoryTransaction } from "@/src/lib/inventoryTransactionClient";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeSpaceId } = useCurrentSpace();
  const { data } = useQuery({ queryKey: ["transaction", id, activeSpaceId], queryFn: () => getInventoryTransaction(id, activeSpaceId || undefined), enabled: Boolean(id) });
  return <div className="space-y-4"><PageHeader eyebrow="Transactions" title={`Transaction ${id}`} description="Transaction detail." /><pre className="border rounded p-3 text-xs">{JSON.stringify(data, null, 2)}</pre></div>;
}
