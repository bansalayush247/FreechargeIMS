"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthErrorMessage, useAuth } from "../../src/auth/authContext";
import { logger } from "../../src/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !redirecting) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isHydrated, redirecting, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    logger.info("Login attempt", { email });

    try {
      await login(email, password);
      setMessage("Login successful.");
      setRedirecting(true);

      window.setTimeout(() => {
        router.replace("/dashboard");
      }, 1200);
    } catch (caughtError) {
      const msg = getAuthErrorMessage(caughtError);
      logger.error("Login failed", { email, message: msg });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10 sm:px-10 lg:px-12">
      <section className="grid w-full gap-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-lg lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-orange-200/70">FreechargeIMS</p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in to manage spaces, requests, and inventory.
          </h1>
          <p className="max-w-xl text-base leading-7 text-orange-50/80">
            Use your backend credentials to authenticate. The session is stored in localStorage and kept in memory for API calls.
          </p>
          <ul className="space-y-2 text-sm text-orange-50/75">
            <li>• Bearer token is attached automatically to protected API calls.</li>
            <li>• The dashboard route redirects unauthenticated users back here.</li>
            <li>• Session state restores after refresh.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-slate-950/40 p-6 ring-1 ring-white/10">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-orange-50/90">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-orange-50 outline-none transition placeholder:text-orange-50/35 focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-orange-50/90">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-12 text-orange-50 outline-none transition placeholder:text-orange-50/35 focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/30"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-orange-50 hover:bg-white/5"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88A3 3 0 0114.12 14.12" />
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.94 12.01C4.32 7.5 8.6 4 12 4c1.85 0 3.56.65 4.93 1.78" />
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21.06 11.99c-1.38 4.51-5.66 8.01-9.06 8.01-1.85 0-3.56-.65-4.93-1.78" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.94 12.01C4.32 7.5 8.6 4 12 4c3.4 0 7.68 3.5 9.06 8.01-1.38 4.51-5.66 8.01-9.06 8.01-3.4 0-7.68-3.5-9.06-8.01z" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
              {error}
            </p>
          ) : null}

          {message ? (
                <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100" role="status">
                  {message}
                </p>
              ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#ff6b35] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#ff8a4c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
