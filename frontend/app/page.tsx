
import Link from "next/link";
import { apiBaseUrl } from "../src/lib/env";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
      <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.35fr_0.9fr] lg:py-20">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#ff6b35]" />
            Connected to {apiBaseUrl}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              FreechargeIMS is the control room for spaces, requests, inventory, and audits.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              The frontend is being built sprint by sprint. The first delivery wires a real API base URL,
              a production-ready shell, and the foundation for login and protected workflows.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[#ff6b35] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#ff8a4c]"
            >
              Go to login
            </Link>
            <a
              href={`${apiBaseUrl.replace(/\/$/, "")}/api/v1`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-orange-50 transition hover:bg-white/10"
            >
              Open API base
            </a>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Sprint 1</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Scaffold status</h2>
          <dl className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <dt>Environment</dt>
              <dd className="font-medium text-white">NEXT_PUBLIC_API_BASE</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <dt>API client</dt>
              <dd className="font-medium text-white">Ready</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Auth flow</dt>
              <dd className="font-medium text-slate-400">Next sprint</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
