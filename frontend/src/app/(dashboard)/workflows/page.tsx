"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Select } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getSpaceById, updateSpace } from "@/src/features/spaces/api";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { useAuthorization } from "@/src/hooks/useAuthorization";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";
import { listWorkflowDefinitions, listWorkflowInstances } from "@/src/lib/workflowClient";

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const { can } = useAuthorization();
  const { data: space } = useQuery({ queryKey: ["spaces", activeSpaceId], queryFn: () => getSpaceById(activeSpaceId as string), enabled: Boolean(activeSpaceId) });
  const { data: definitions = [], isLoading: defsLoading, isError: defsError } = useQuery({
    queryKey: ["workflow-definitions", activeSpaceId],
    queryFn: () => listWorkflowDefinitions(activeSpaceId ?? undefined),
    enabled: Boolean(activeSpaceId),
  });
  const { data: instances = [], isLoading: instancesLoading, isError: instancesError } = useQuery({
    queryKey: ["workflow-instances", activeSpaceId],
    queryFn: () => listWorkflowInstances(activeSpaceId ?? undefined),
    enabled: Boolean(activeSpaceId),
  });
  const definitionList = definitions as Array<{ _id?: string; id?: string; name?: string; code?: string; description?: string; entityType?: string; steps?: unknown[] }>;
  const instanceList = instances as Array<{ _id?: string; id?: string; status?: string; workflowDefinitionId?: { name?: string } | string; currentStepKey?: string }>;
  const configure = useMutation({
    mutationFn: (payload: { employeeWorkflowDefinitionId?: string | null; merchantWorkflowDefinitionId?: string | null }) => updateSpace(activeSpaceId as string, payload),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["spaces", activeSpaceId] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Workflows"
        description="Approval paths and their running executions for the active space."
        actions={can(BACKEND_PERMISSIONS.CREATE_WORKFLOW) ? <Link href="/workflows/create" className={buttonVariants()}><Plus className="h-4 w-4" />Create workflow</Link> : undefined}
      />
      {can(BACKEND_PERMISSIONS.UPDATE_SPACE) && activeSpaceId ? (
        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">Employee request workflow</p>
              <Select value={space?.employeeWorkflowDefinitionId || ""} disabled={configure.isPending} onChange={(event) => configure.mutate({ employeeWorkflowDefinitionId: event.target.value || null })}>
                <option value="">Default employee workflow</option>
                {definitionList.map((definition) => {
                  const id = definition._id || definition.id || "";
                  return id ? <option key={id} value={id}>{definition.name || definition.code}</option> : null;
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">Merchant request workflow</p>
              <Select value={space?.merchantWorkflowDefinitionId || ""} disabled={configure.isPending} onChange={(event) => configure.mutate({ merchantWorkflowDefinitionId: event.target.value || null })}>
                <option value="">Default merchant workflow</option>
                {definitionList.map((definition) => {
                  const id = definition._id || definition.id || "";
                  return id ? <option key={id} value={id}>{definition.name || definition.code}</option> : null;
                })}
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-6">
            <div><p className="font-semibold text-slate-900">Definitions</p><p className="text-sm text-slate-600">Reusable approval paths for this space.</p></div>
            {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view workflows.</div> : defsLoading ? <Skeleton className="h-32 w-full" /> : defsError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Workflow definitions could not be loaded.</div> : definitionList.length ? definitionList.map((definition) => (
              <Link href={`/workflows/${definition._id || definition.id}`} key={definition._id || definition.id} className="block rounded-2xl border border-orange-100 bg-white p-4 transition hover:border-orange-300">
                <p className="font-medium text-slate-900">{definition.name || definition.code || "Workflow"}</p>
                <p className="text-sm text-slate-600">{definition.description || "No description provided."}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{definition.entityType || "Entity"} · {definition.steps?.length || 0} steps</p>
              </Link>
            )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No workflow definitions yet. Create one or submit the first request to generate a default workflow.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <div><p className="font-semibold text-slate-900">Instances</p><p className="text-sm text-slate-600">Live and completed executions for requests in this space.</p></div>
            {!activeSpaceId ? <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">Select a space to view workflow instances.</div> : instancesLoading ? <Skeleton className="h-32 w-full" /> : instancesError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Workflow instances could not be loaded.</div> : instanceList.length ? instanceList.map((instance) => (
              <div key={instance._id || instance.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                <p className="font-medium text-slate-900">{typeof instance.workflowDefinitionId === "string" ? instance.workflowDefinitionId : instance.workflowDefinitionId?.name || "Workflow instance"}</p>
                <p className="text-sm text-slate-600">{instance.status || "UNKNOWN"}{instance.currentStepKey ? ` · ${instance.currentStepKey}` : ""}</p>
              </div>
            )) : <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No workflow instances yet. Each new asset request creates one.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
