"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { WorkflowForm, buildWorkflowPayload, type WorkflowFormValue } from "@/src/features/workflows/workflow-form";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { useAuthorization } from "@/src/hooks/useAuthorization";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";
import { deleteWorkflowDefinition, getWorkflowDefinition, updateWorkflowDefinition } from "@/src/lib/workflowClient";

type WorkflowDefinition = { _id?: string; id?: string; name?: string; code?: string; description?: string; steps?: Array<{ stepKey?: string; name?: string }> };

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const { can } = useAuthorization();
  const { data, isLoading, isError } = useQuery({ queryKey: ["workflow-definition", activeSpaceId, id], queryFn: () => getWorkflowDefinition(id, activeSpaceId ?? undefined), enabled: Boolean(activeSpaceId && id) });
  const workflow = data as WorkflowDefinition | undefined;
  const update = useMutation({
    mutationFn: (value: WorkflowFormValue) => {
      const { code: _code, entityType: _entityType, ...payload } = buildWorkflowPayload(value);
      return updateWorkflowDefinition(id, payload, activeSpaceId ?? undefined);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workflow-definition", activeSpaceId, id] }),
        queryClient.invalidateQueries({ queryKey: ["workflow-definitions", activeSpaceId] }),
      ]);
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteWorkflowDefinition(id, activeSpaceId ?? undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workflow-definitions", activeSpaceId] });
      router.push("/workflows");
    },
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !workflow) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Workflow could not be loaded.</div>;

  const initialValue: WorkflowFormValue = {
    name: workflow.name || "",
    code: workflow.code || "",
    description: workflow.description || "",
    steps: (workflow.steps || []).map((step) => ({ stepKey: step.stepKey || "", name: step.name || step.stepKey || "" })),
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workflows" title={workflow.name || "Workflow"} description="Edit the approval path used for future workflow instances." actions={<Button variant="outline" onClick={() => router.push("/workflows")}><ArrowLeft className="h-4 w-4" />Back</Button>} />
      {can(BACKEND_PERMISSIONS.UPDATE_WORKFLOW) ? <WorkflowForm key={id + workflow.code + workflow.name} initialValue={initialValue} codeDisabled submitLabel="Save changes" pending={update.isPending} onSubmit={(value) => update.mutate(value)} /> : null}
      {can(BACKEND_PERMISSIONS.DELETE_WORKFLOW) ? <Button variant="outline" disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete workflow "${workflow.name}"?`)) remove.mutate(); }}><Trash2 className="h-4 w-4" />{remove.isPending ? "Deleting..." : "Delete workflow"}</Button> : null}
    </div>
  );
}
