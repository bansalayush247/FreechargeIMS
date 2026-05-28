"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { createRepair } from "@/src/lib/repairClient";
export default function CreateRepairPage() {
  const [title, setTitle] = useState("");
  const router = useRouter();
  const create = useMutation({ mutationFn: () => createRepair({ title }) });
  return <div className="space-y-3"><PageHeader eyebrow="Repairs" title="Create repair" description="Open a new repair request." /><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Repair title" /><Button onClick={async () => { const x = await create.mutateAsync(); router.push(`/repairs/${x.id || x._id}`); }}>Create</Button></div>;
}
