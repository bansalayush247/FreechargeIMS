"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { listInventoryTransactions } from "@/src/lib/inventoryTransactionClient";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
export default function TransactionsPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { data } = useQuery({ queryKey: ["transactions", activeSpaceId], queryFn: () => listInventoryTransactions({ spaceId: activeSpaceId || undefined }), enabled: Boolean(activeSpaceId) });
  const items = data?.data?.items ?? data?.items ?? [];
  return <div className="space-y-4"><PageHeader eyebrow="Transactions" title="Inventory transactions" description="Global transaction feed for selected space." actions={<Link href="/transactions/create">Create</Link>} />
    {items.map((t: { id?: string; _id?: string; type?: string }) => <Link key={t.id || t._id} href={`/transactions/${t.id || t._id}`} className="block border rounded p-3">{t.type || "transaction"}</Link>)}
  </div>;
}
