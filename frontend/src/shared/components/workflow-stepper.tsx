import { cn } from "@/src/lib/utils";

export function WorkflowStepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex flex-1 items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                isComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : isCurrent
                    ? "border-brand bg-brand/10 text-brand-strong"
                    : "border-slate-200 bg-white text-slate-500",
              )}
            >
              {index + 1}
            </div>
            <div>
              <p className={cn("text-sm font-medium", isCurrent ? "text-slate-950" : "text-slate-700")}>{step}</p>
            </div>
            {index < steps.length - 1 ? <div className="hidden h-px flex-1 bg-slate-200 sm:block" /> : null}
          </div>
        );
      })}
    </div>
  );
}
