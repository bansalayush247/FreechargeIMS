"use client";

import React, { useEffect, useId } from "react";
import { createPortal } from "react-dom";

export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!open || !portalTarget) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, portalTarget]);

  if (!open || !portalTarget) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex min-h-dvh items-center justify-center overflow-y-auto p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="fixed inset-0 cursor-default bg-white/75"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="relative z-[2147483647] w-full max-w-2xl animate-[modalIn_160ms_ease-out] overflow-hidden rounded-lg border border-orange-100 bg-white text-slate-900 shadow-[0_20px_60px_rgba(255,107,53,0.15)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-orange-100 px-5 py-4">
          {title && (
            <h3 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h3>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md border border-orange-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-orange-50"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    </div>,
    portalTarget
  );
}
