import { ShieldCheck, Warehouse } from "lucide-react";
import { env } from "@/src/config/env";
import { Card, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm text-slate-700 backdrop-blur">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Secure access on {env.NEXT_PUBLIC_API_BASE}
        </div>

        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Enterprise inventory workflows need a clean boundary between UI, data, and authorization.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            This login surface is a thin shell around feature logic, React Hook Form, Zod validation, and centralized session handling.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "Persistent auth session",
            "Role aware dashboard routes",
            "Refresh token recovery",
            "Shared UI primitives",
          ].map((item) => (
            <Card key={item}>
              <CardHeader>
                <CardTitle className="text-base">{item}</CardTitle>
                <CardDescription>Production ready starter pattern for enterprise IMS teams.</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Warehouse className="h-4 w-4 text-brand" />
          App Router route groups keep auth and dashboard boundaries isolated.
        </div>
      </section>

      <section>{children}</section>
    </main>
  );
}
