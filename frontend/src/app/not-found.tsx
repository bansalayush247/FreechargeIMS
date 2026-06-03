import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-[0_20px_60px_rgba(255,107,53,0.12)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">The route does not exist or was moved into the new dashboard architecture.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-brand-strong">
          Return home
        </Link>
      </section>
    </main>
  );
}