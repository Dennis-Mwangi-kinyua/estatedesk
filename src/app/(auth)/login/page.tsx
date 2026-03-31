"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowRight,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  LayoutGrid,
  BriefcaseBusiness,
} from "lucide-react";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {
  success: false,
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="min-h-screen overflow-y-auto bg-neutral-50 text-neutral-950">
      <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        {/* Left panel */}
        <section className="flex flex-col justify-between border-b border-black/5 bg-white px-5 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:border-black/5 lg:px-14 lg:py-14">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-black text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight sm:text-base">
                  EstateDesk
                </p>
                <p className="text-xs text-neutral-500 sm:text-sm">
                  Property operations platform
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-2xl sm:mt-14 lg:mt-24">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                Secure Workspace Access
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl lg:leading-[1.04]">
                Professional property management for modern teams.
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
                Manage rentals, staff workflows, tenant operations, reporting,
                and billing from one clean, structured workspace.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:max-w-2xl">
              <div className="rounded-3xl border border-black/10 bg-neutral-50 p-5">
                <ShieldCheck className="h-5 w-5" />
                <p className="mt-4 text-sm font-semibold">Secure sign-in</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Role-based access for managers, accountants, staff, and tenants.
                </p>
              </div>

              <div className="rounded-3xl border border-black/10 bg-neutral-50 p-5">
                <LayoutGrid className="h-5 w-5" />
                <p className="mt-4 text-sm font-semibold">Structured workflows</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Built for rent tracking, operations, expenses, and reporting.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-neutral-400">
            <span>Reliable</span>
            <span>Professional</span>
            <span>Focused</span>
          </div>
        </section>

        {/* Right panel */}
        <section className="flex min-h-[58vh] items-end px-4 pt-3 pb-4 sm:px-8 sm:pt-5 sm:pb-8 lg:min-h-screen lg:items-center lg:px-14 lg:py-14">
          <div className="w-full">
            <div className="mx-auto w-full max-w-md rounded-[30px] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)] sm:rounded-[34px] sm:p-8 lg:max-w-lg">
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-neutral-950" />
                  Secure Login
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Sign in to continue to your EstateDesk workspace.
                </p>
              </div>

              <form action={formAction} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-neutral-800"
                  >
                    Email address
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-4 transition focus-within:border-neutral-950 focus-within:bg-white">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
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
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-neutral-800"
                  >
                    Password
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-4 transition focus-within:border-neutral-950 focus-within:bg-white">
                    <Lock className="h-4 w-4 text-neutral-400" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
                    />
                  </div>
                  {state.fieldErrors?.password?.length ? (
                    <p className="text-sm text-red-600">
                      {state.fieldErrors.password[0]}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="inline-flex items-center gap-3 text-neutral-700">
                    <input
                      type="checkbox"
                      name="remember"
                      className="h-4 w-4 rounded border border-black/20 text-black focus:ring-0"
                    />
                    <span>Remember me</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="font-medium text-neutral-500 transition hover:text-neutral-950"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {state.error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {state.error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-4 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "Signing in..." : "Sign In"}
                  {!pending && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative py-3 text-center">
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/10" />
                  <span className="relative bg-white px-3 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                    or
                  </span>
                </div>

                <div className="mt-3 text-center text-sm text-neutral-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-neutral-950 transition hover:underline"
                  >
                    Register Now
                  </Link>
                </div>

                <Link
                  href="/services"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-4 text-sm font-medium text-neutral-900 transition hover:border-black/20 hover:bg-neutral-100"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  View Available Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}