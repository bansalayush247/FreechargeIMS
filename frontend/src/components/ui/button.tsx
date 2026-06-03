import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand text-slate-950 hover:bg-brand-strong",
        secondary: "border border-orange-100 bg-white text-slate-900 hover:bg-orange-50",
        outline: "border border-orange-200 bg-transparent text-slate-700 hover:bg-orange-50 hover:text-slate-900",
        ghost: "text-slate-700 hover:bg-orange-50 hover:text-slate-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-2xl px-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = "button", ...props }, ref) => {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});
Button.displayName = "Button";