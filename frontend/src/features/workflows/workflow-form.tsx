"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";

export type WorkflowStepInput = {
  stepKey: string;
  name: string;
};

export type WorkflowFormValue = {
  name: string;
  code: string;
  description: string;
  steps: WorkflowStepInput[];
};

const STEP_OPTIONS = [
  { key: "MANAGER_APPROVAL", label: "Manager approval" },
  { key: "IT_APPROVAL", label: "IT approval" },
  { key: "ZONAL_APPROVAL", label: "Zonal approval" },
  { key: "FULFILLMENT", label: "Fulfillment" },
];

export function toWorkflowCode(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function buildWorkflowPayload(value: WorkflowFormValue) {
  return {
    name: value.name.trim(),
    code: value.code,
    description: value.description.trim(),
    entityType: "ASSET_REQUEST",
    steps: value.steps.map((step, index) => ({
      stepKey: step.stepKey,
      name: step.name,
      order: index + 1,
      allowedActions: step.stepKey === "FULFILLMENT" ? ["COMPLETE", "REJECT"] : ["APPROVE", "REJECT"],
      approverRoleIds: [],
      nextStepKey: value.steps[index + 1]?.stepKey || "",
    })),
  };
}

export function WorkflowForm({
  initialValue,
  submitLabel,
  pending,
  codeDisabled = false,
  onSubmit,
}: {
  initialValue?: WorkflowFormValue;
  submitLabel: string;
  pending: boolean;
  codeDisabled?: boolean;
  onSubmit: (value: WorkflowFormValue) => void;
}) {
  const [name, setName] = useState(initialValue?.name || "");
  const [code, setCode] = useState(initialValue?.code || "");
  const [description, setDescription] = useState(initialValue?.description || "");
  const [steps, setSteps] = useState<WorkflowStepInput[]>(initialValue?.steps || [{ stepKey: "MANAGER_APPROVAL", name: "Manager Approval" }, { stepKey: "FULFILLMENT", name: "Fulfillment" }]);
  const duplicateStep = useMemo(() => new Set(steps.map((step) => step.stepKey)).size !== steps.length, [steps]);
  const canSubmit = Boolean(name.trim() && code && steps.length && !duplicateStep && !pending);

  const updateStep = (index: number, stepKey: string) => {
    const label = STEP_OPTIONS.find((option) => option.key === stepKey)?.label || stepKey;
    setSteps((current) => current.map((step, itemIndex) => itemIndex === index ? { stepKey, name: label.replace(/\b\w/g, (letter) => letter.toUpperCase()) } : step));
  };
  const moveStep = (index: number, offset: number) => {
    setSteps((current) => {
      const next = [...current];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="space-y-5 rounded-2xl border border-orange-100 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="workflow-name">Name</Label><Input id="workflow-name" value={name} onChange={(event) => { setName(event.target.value); if (!codeDisabled) setCode(toWorkflowCode(event.target.value)); }} /></div>
        <div className="space-y-2"><Label htmlFor="workflow-code">Code</Label><Input id="workflow-code" value={code} onChange={(event) => setCode(toWorkflowCode(event.target.value))} disabled={codeDisabled} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="workflow-description">Description</Label><Input id="workflow-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3"><div><p className="font-medium text-slate-900">Steps</p><p className="text-sm text-slate-600">Requests move through these steps from top to bottom.</p></div><Button variant="outline" onClick={() => setSteps((current) => [...current, { stepKey: "FULFILLMENT", name: "Fulfillment" }])}><Plus className="h-4 w-4" />Add step</Button></div>
        {duplicateStep ? <p className="text-sm text-rose-600">Each workflow step can appear only once.</p> : null}
        {steps.map((step, index) => (
          <div key={`${step.stepKey}-${index}`} className="flex flex-wrap items-center gap-2 rounded-2xl border border-orange-100 p-3">
            <span className="w-7 text-center text-sm font-medium text-slate-500">{index + 1}</span>
            <Select className="min-w-56 flex-1" value={step.stepKey} onChange={(event) => updateStep(index, event.target.value)}>
              {STEP_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </Select>
            <Button size="icon" variant="outline" title="Move up" disabled={index === 0} onClick={() => moveStep(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" title="Move down" disabled={index === steps.length - 1} onClick={() => moveStep(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" title="Remove step" disabled={steps.length === 1} onClick={() => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <Button disabled={!canSubmit} onClick={() => onSubmit({ name, code, description, steps })}>{pending ? "Saving..." : submitLabel}</Button>
    </div>
  );
}
