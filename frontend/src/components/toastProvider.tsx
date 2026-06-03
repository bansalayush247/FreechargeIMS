"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: string; type: "info" | "success" | "error"; message: string };

const ToastContext = createContext<{
  show: (type: Toast["type"], message: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function show(type: Toast["type"], message: string) {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const t = { id, type, message } as Toast;
    setToasts((s) => [...s, t]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000);
  }

  const value = useMemo(() => ({ show }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-sm rounded-md p-3 text-sm shadow-lg ${
              t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-slate-700"
            } text-white`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
