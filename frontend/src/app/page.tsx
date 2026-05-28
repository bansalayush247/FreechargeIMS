
import Link from "next/link";
import { ArrowRight, Boxes, ShieldCheck, Sparkles, Warehouse } from "lucide-react";
import { env } from "@/src/config/env";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-lg shadow-orange-100/40 backdrop-blur">
            <Sparkles className="h-4 w-4 text-brand" />
            Production architecture backed by {env.NEXT_PUBLIC_API_BASE}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              A scalable inventory platform architecture for large teams, long-term maintenance, and fast iteration.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              This scaffold separates features, services, stores, schemas, and UI primitives so product,
              warehouse, auth, and dashboard work can scale without turning UI into business logic.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={"/login"} className={buttonVariants({ size: "lg" }) + " rounded-2xl"}>
              Open auth flow
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={"/dashboard"} className={buttonVariants({ variant: "secondary", size: "lg" }) + " rounded-2xl"}>
              Open dashboard shell
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: ShieldCheck,
              title: "Auth and permissions",
              description: "Token handling, refresh flow, role checks, and guard rails live outside the UI layer.",
            },
            {
              icon: Boxes,
              title: "Feature modules",
              description: "Auth, products, warehouses, inventory, orders, users, and settings stay independently scalable.",
            },
            {
              icon: Warehouse,
              title: "Reusable UI",
              description: "Tables, forms, dialogs, and page shells are shared primitives, not copied page code.",
            },
            {
              icon: Sparkles,
              title: "Enterprise defaults",
              description: "Query caching, validated env, strict typing, and consistent route conventions are baked in.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="h-5 w-5 text-brand" />
                <CardTitle className="mt-3 text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">Built for App Router, TypeScript, and layered ownership.</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
