"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { routePaths } from "@/src/constants/routes";
import { getApiErrorMessage } from "@/src/services/http/client";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAuth } from "@/src/features/auth/auth-provider";
import { loginSchema, type LoginSchema } from "@/src/features/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginSchema) {
    setFormError(null);

    try {
      await login(values);
      router.replace(routePaths.dashboard.home);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Unable to sign in right now."));
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to manage inventory, warehouses, and requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              <Input id="email" type="email" placeholder="you@company.com" className="pl-9" {...form.register("email")} />
            </div>
            {form.formState.errors.email ? <p className="text-sm text-rose-300">{form.formState.errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" {...form.register("password")} />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-orange-50 hover:text-slate-900"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password ? <p className="text-sm text-rose-300">{form.formState.errors.password.message}</p> : null}
          </div>

          {formError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>

          <p className="text-sm text-slate-600">
            Need an account?{" "}
            <Link href={routePaths.auth.signup} className={buttonVariants({ variant: "ghost", size: "sm" }) + " inline-flex p-0 text-brand hover:text-brand-strong"}>
              Create one
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}