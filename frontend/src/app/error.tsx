"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-900">
        <div className="max-w-lg space-y-4 rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-[0_20px_60px_rgba(255,107,53,0.12)] backdrop-blur">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm leading-6 text-slate-600">The page hit an unexpected error. Retry the action or reload the app shell.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-brand-strong"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}