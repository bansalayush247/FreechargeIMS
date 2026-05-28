"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const portalTarget = typeof document === "undefined" ? null : document.body;

  React.useEffect(() => {
    if (!open || !portalTarget) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open, portalTarget]);

  if (!open || !portalTarget) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 px-4 py-8 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog" onClick={() => onOpenChange(false)} />
      <div className={cn("relative z-[101] w-full max-w-2xl rounded-3xl border border-orange-100 bg-white text-slate-900 shadow-[0_20px_60px_rgba(255,107,53,0.15)]") }>
        <div className="flex items-start justify-between gap-4 border-b border-orange-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-slate-700 transition hover:bg-orange-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    portalTarget,
  );
}
