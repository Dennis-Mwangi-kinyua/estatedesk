"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {
  success: false,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  const globalError = useMemo(() => {
    if (!state?.error) return null;
    return state.error;
  }, [state]);

  return (
    <div className="min-h-dvh bg-white lg:bg-neutral-100">
      <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden bg-neutral-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-white/90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Building2 className="h-5 w-5" />
              </div>
              <span>EstateDesk</span>
            </Link>
          </div>

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Secure role-based access
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight">
              Sign in to your dashboard
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-white/70">
              Access your properties, tenants, payments, reports, and daily
              operations with secure role-based access for admins, staff,
              caretakers, and tenants.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm font-medium text-white">
                  Role-based routing
                </p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Tenants, caretakers, staff, and admins are directed to the
                  dashboard that matches their account role after login.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm font-medium text-white">
                  Secure account access
                </p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Every account gets the right level of access based on assigned
                  permissions and responsibilities.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/45">
            © {new Date().getFullYear()} EstateDesk. All rights reserved.
          </div>
        </aside>

        <main className="flex min-h-dvh flex-col lg:justify-center lg:px-12">
          <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col lg:min-h-0 lg:justify-center">
            <div className="sticky top-0 z-10 border-b border-black/5 bg-white/95 px-4 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] backdrop-blur sm:px-6 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <span>EstateDesk</span>
              </Link>
            </div>

            <div className="flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pt-5 lg:px-0 lg:py-0">
              <div className="w-full bg-white p-5 sm:p-6 lg:rounded-[2rem] lg:border lg:border-black/5 lg:p-8 lg:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                <div className="mb-6 lg:mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600 lg:hidden">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secure login
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Sign in with your email and password to continue.
                  </p>
                </div>

                <form action={formAction} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-neutral-800"
                    >
                      Email address
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 transition focus-within:border-neutral-950 focus-within:bg-white">
                      <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
                      />
                    </div>
                    {state.fieldErrors?.email?.length ? (
                      <p className="text-sm text-red-600">
                        {state.fieldErrors.email[0]}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-neutral-800"
                      >
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 transition focus-within:border-neutral-950 focus-within:bg-white">
                      <LockKeyhole className="h-4 w-4 shrink-0 text-neutral-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="shrink-0 text-neutral-400 transition hover:text-neutral-700"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {state.fieldErrors?.password?.length ? (
                      <p className="text-sm text-red-600">
                        {state.fieldErrors.password[0]}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-3 text-sm text-neutral-600">
                      <input
                        type="checkbox"
                        name="remember"
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                      />
                      <span>Remember me</span>
                    </label>
                  </div>

                  {globalError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {globalError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{isPending ? "Signing in..." : "Sign in"}</span>
                    {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </form>

                <div className="mt-6 rounded-2xl bg-neutral-50 p-4 lg:hidden">
                  <p className="text-sm font-medium text-neutral-900">
                    Access your account securely
                  </p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    After login, you’ll be routed to the correct dashboard based
                    on your assigned role.
                  </p>
                </div>

                <div className="mt-8 text-center text-sm text-neutral-600">
                  Need an account?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-neutral-950 transition hover:opacity-70"
                  >
                    Create one
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}