"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { listWorkflowDefinitions, listWorkflowInstances } from "@/src/lib/workflowClient";

function getItems(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!root || typeof root !== "object") return [];
  const items = (root as { items?: unknown[] }).items;
  return Array.isArray(items) ? items : [];
}

export default function WorkflowsPage() {
  const { data: defsData, isLoading: defsLoading, isError: defsError } = useQuery({ queryKey: ["workflow-definitions"], queryFn: listWorkflowDefinitions });
  const { data: instancesData, isLoading: instancesLoading, isError: instancesError } = useQuery({ queryKey: ["workflow-instances"], queryFn: listWorkflowInstances });
  const definitions = getItems(defsData) as Array<{ _id?: string; id?: string; name?: string; description?: string; type?: string }>;
  const instances = getItems(instancesData) as Array<{ _id?: string; id?: string; status?: string; workflowDefinitionId?: { name?: string } | string; currentStep?: string }>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Workflows" description="Configure the approval and fulfillment paths used by employee and merchant request flows." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-6">
            {defsLoading ? <Skeleton className="h-32 w-full" /> : defsError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Workflow definitions could not be loaded.</div> : definitions.length ? definitions.map((definition) => (
              <div key={definition._id || definition.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                <p className="font-medium text-slate-900">{definition.name || definition.type || "Workflow"}</p>
                <p className="text-sm text-slate-600">{definition.description || "No description provided."}</p>
              </div>
            )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No workflow definitions returned.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            {instancesLoading ? <Skeleton className="h-32 w-full" /> : instancesError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Workflow instances could not be loaded.</div> : instances.length ? instances.map((instance) => (
              <div key={instance._id || instance.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                <p className="font-medium text-slate-900">{typeof instance.workflowDefinitionId === "string" ? instance.workflowDefinitionId : instance.workflowDefinitionId?.name || "Workflow instance"}</p>
                <p className="text-sm text-slate-600">{instance.status || "UNKNOWN"}{instance.currentStep ? ` · ${instance.currentStep}` : ""}</p>
              </div>
            )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No workflow instances returned.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}