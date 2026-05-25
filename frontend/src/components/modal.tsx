"use client";

import React from "react";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white/5 p-6 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-white/80 hover:text-white">Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
