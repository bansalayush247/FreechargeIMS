import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "border-orange-200 bg-orange-50 text-orange-700",
      secondary: "border-slate-200 bg-white text-slate-600",
      success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
      warning: "border-brand/20 bg-brand/10 text-brand-strong",
      danger: "border-rose-400/20 bg-rose-500/10 text-rose-100",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}