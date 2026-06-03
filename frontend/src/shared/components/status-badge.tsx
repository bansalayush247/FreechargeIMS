import { cn } from "@/src/lib/utils";

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
  children?: React.ReactNode;
}) {
  const styles = {
    neutral: "border-slate-200 bg-white text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-brand/20 bg-brand/10 text-brand-strong",
  };

  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]", styles[status], className)}>{children}</span>;
}
