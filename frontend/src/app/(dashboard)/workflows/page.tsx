"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { listWorkflowDefinitions } from "@/src/lib/workflowClient";
export default function WorkflowsPage() {
  const { data = [] } = useQuery({ queryKey: ["workflow-definitions"], queryFn: listWorkflowDefinitions });
  return <div className="space-y-4"><PageHeader eyebrow="Workflows" title="Workflow definitions" description="State-machine definitions and execution flows." />
    {(data as Array<{ id?: string; _id?: string; name?: string; states?: string[] }>).map((w) => <Link key={w.id || w._id} href={`/workflows/${w.id || w._id}`} className="block border rounded p-3">{w.name} ({w.states?.length || 0} steps)</Link>)}
  </div>;
}
