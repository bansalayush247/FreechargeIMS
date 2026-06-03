"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { listWorkflowInstances, transitionWorkflow } from "@/src/lib/workflowClient";
export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data = [] } = useQuery({ queryKey: ["workflow-instances", id], queryFn: listWorkflowInstances });
  const [transition, setTransition] = useState("");
  const perform = useMutation({ mutationFn: (instanceId: string) => transitionWorkflow(instanceId, transition) });
  return <div className="space-y-4"><PageHeader eyebrow="Workflows" title={`Workflow ${id}`} description="Transition instances and visualize steps." />
    <Input value={transition} onChange={(e) => setTransition(e.target.value)} placeholder="Transition action" />
    {(data as Array<{ id?: string; _id?: string; state?: string }>).map((x) => <div key={x.id || x._id} className="border rounded p-3 flex justify-between"><span>{x.state || "unknown state"}</span><Button onClick={() => perform.mutate((x.id || x._id) as string)}>Transition</Button></div>)}
  </div>;
}
