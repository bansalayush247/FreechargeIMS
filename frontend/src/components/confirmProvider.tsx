"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type Pending = {
  resolve: (v: boolean) => void;
  title?: string;
  message?: string;
};

const ConfirmContext = createContext<{ confirm: (title?: string, message?: string) => Promise<boolean> } | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((title?: string, message?: string) => {
    return new Promise<boolean>((resolve) => {
      setPending({ resolve, title, message });
    });
  }, []);

  function doResolve(value: boolean) {
    if (pending) {
      pending.resolve(value);
      setPending(null);
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {pending && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-slate-900">
            <h3 className="text-lg font-semibold">{pending.title ?? "Confirm"}</h3>
            {pending.message && <p className="mt-2 text-sm text-slate-700">{pending.message}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => doResolve(false)} className="rounded-md px-3 py-1">Cancel</button>
              <button onClick={() => doResolve(true)} className="rounded-md bg-blue-600 px-3 py-1 text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
