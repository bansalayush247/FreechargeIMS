import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center text-slate-900 shadow-[0_20px_60px_rgba(255,107,53,0.12)] backdrop-blur">
        <h1 className="text-2xl font-semibold">Dashboard item not found</h1>
        <p className="mt-2 text-sm text-slate-600">The requested module or entity is not available in this starter scaffold.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-medium text-slate-950">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}