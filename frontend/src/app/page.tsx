
import Link from "next/link";
import { ArrowRight, Boxes, ShieldCheck, Sparkles, Workflow, Warehouse } from "lucide-react";
import { env } from "@/src/config/env";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { routePaths } from "@/src/constants/routes";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 py-8 sm:px-10 lg:px-12">
      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-lg shadow-orange-100/40 backdrop-blur">
            <Sparkles className="h-4 w-4 text-brand" />
            Connected to {env.NEXT_PUBLIC_API_BASE}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              FreechargeIMS is the operating system for assets, inventory, requests, and approvals.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              The frontend is organized around business workflows: request intake, inventory movement, merchant operations, and space-based administration.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={routePaths.auth.login} className={buttonVariants({ size: "lg" }) + " rounded-2xl"}>
              Open sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={routePaths.dashboard.home} className={buttonVariants({ variant: "secondary", size: "lg" }) + " rounded-2xl"}>
              Open workspace
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: ShieldCheck,
              title: "Role aware access",
              description: "Users see only the spaces and workflow tools that match their assigned role.",
            },
            {
              icon: Boxes,
              title: "Inventory first",
              description: "Assets, transfers, returns, and history are treated as first-class operational flows.",
            },
            {
              icon: Warehouse,
              title: "Catalog operations",
              description: "Products, merchants, and warehouses live in a clear catalog layer.",
            },
            {
              icon: Workflow,
              title: "Approval workflows",
              description: "Employee and merchant request flows remain separate but share the same UI patterns.",
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
