import { cn } from "@/src/lib/utils";

export type TimelineItem = {
  title: string;
  description?: string;
  state?: "complete" | "current" | "upcoming";
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => {
        const active = item.state === "current";
        const complete = item.state === "complete";

        return (
          <li key={`${item.title}-${index}`} className="flex gap-4">
            <div
              className={cn(
                "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : active ? "border-brand bg-brand/10 text-brand-strong" : "border-slate-200 bg-white text-slate-500",
              )}
            >
              {complete ? "✓" : index + 1}
            </div>
            <div className="space-y-1">
              <p className={cn("font-medium", active ? "text-slate-950" : "text-slate-800")}>{item.title}</p>
              {item.description ? <p className="text-sm leading-6 text-slate-600">{item.description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
