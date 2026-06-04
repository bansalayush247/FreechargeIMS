"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { WorkflowForm, buildWorkflowPayload, type WorkflowFormValue } from "@/src/features/workflows/workflow-form";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { useAuthorization } from "@/src/hooks/useAuthorization";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";
import { createWorkflowDefinition } from "@/src/lib/workflowClient";

export default function CreateWorkflowPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const { can } = useAuthorization();
  const create = useMutation({
    mutationFn: (value: WorkflowFormValue) => createWorkflowDefinition(buildWorkflowPayload(value), activeSpaceId ?? undefined),
    onSuccess: async (workflow: { _id?: string; id?: string }) => {
      await queryClient.invalidateQueries({ queryKey: ["workflow-definitions", activeSpaceId] });
      router.push(`/workflows/${workflow._id || workflow.id}`);
    },
  });

  if (!can(BACKEND_PERMISSIONS.CREATE_WORKFLOW)) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">You do not have permission to create workflows.</div>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workflows" title="Create workflow" description="Build an asset-request approval path for the active space." actions={<Button variant="outline" onClick={() => router.push("/workflows")}><ArrowLeft className="h-4 w-4" />Back</Button>} />
      <WorkflowForm submitLabel="Create workflow" pending={create.isPending} onSubmit={(value) => create.mutate(value)} />
    </div>
  );
}
