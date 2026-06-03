"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldUser, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { routePaths } from "@/src/constants/routes";
import { getApiErrorMessage } from "@/src/services/http/client";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { useAuth } from "@/src/features/auth/auth-provider";
import { signupSchema, type SignupSchema } from "@/src/features/auth/schemas";

const userTypeOptions = [
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Merchant", value: "MERCHANT" },
];

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      employeeId: "",
      email: "",
      password: "",
      userType: "EMPLOYEE",
    },
  });

  async function onSubmit(values: SignupSchema) {
    setFormError(null);

    try {
      await signup(values);
      router.replace(routePaths.dashboard.home);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Unable to create the account right now."));
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Set up a new IMS user and open the dashboard immediately after signup.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" placeholder="Aman" {...form.register("firstName")} />
              {form.formState.errors.firstName ? <p className="text-sm text-rose-300">{form.formState.errors.firstName.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" placeholder="Sharma" {...form.register("lastName")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <div className="relative">
              <ShieldUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              <Input id="employeeId" placeholder="EMP-1024" className="pl-9" {...form.register("employeeId")} />
            </div>
            {form.formState.errors.employeeId ? <p className="text-sm text-rose-300">{form.formState.errors.employeeId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              <Input id="email" type="email" placeholder="you@company.com" className="pl-9" {...form.register("email")} />
            </div>
            {form.formState.errors.email ? <p className="text-sm text-rose-300">{form.formState.errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType">User type</Label>
            <div className="relative">
              <UserCog className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              <Select id="userType" className="pl-9" {...form.register("userType")}>
                {userTypeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-white">
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            {form.formState.errors.userType ? <p className="text-sm text-rose-300">{form.formState.errors.userType.message}</p> : null}
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
            Create account
          </Button>

          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href={routePaths.auth.login} className="text-brand transition hover:text-brand-strong">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}