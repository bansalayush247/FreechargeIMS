"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { createInventoryTransaction } from "@/src/lib/inventoryTransactionClient";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
export default function CreateTransactionPage() {
  const { activeSpaceId } = useCurrentSpace();
  const [type, setType] = useState("");
  const create = useMutation({ mutationFn: () => createInventoryTransaction({ type }, activeSpaceId || undefined) });
  return <div className="space-y-4"><PageHeader eyebrow="Transactions" title="Manual transaction" description="Create a manual inventory transaction." /><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="issue/receive/adjust" /><Button onClick={() => create.mutate()}>Create</Button></div>;
}
