"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRight,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  BriefcaseBusiness,
  Receipt,
  Building,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginAction, type LoginActionState } from "./(auth)/login/actions";

const initialState: LoginActionState = {
  success: false,
};

const systemHighlights = [
  {
    title: "Property operations",
    description:
      "Manage properties, buildings, units, leases, tenants, inspections, notices, and move-outs in one workspace.",
    icon: Building,
  },
  {
    title: "Payments and billing",
    description:
      "Track rent, water bills, taxes, M-Pesa payments, receipts, and billing activity with clarity.",
    icon: Receipt,
  },
  {
    title: "Role-based access",
    description:
      "Support admins, managers, office staff, accountants, caretakers, and tenants with scoped permissions.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-dvh bg-white text-neutral-950 lg:bg-neutral-50">
      <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden flex-col justify-between border-b border-black/5 bg-white px-5 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10 lg:flex lg:min-h-dvh lg:border-r lg:border-b-0 lg:px-14 lg:py-14">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-base font-semibold tracking-tight">
                  EstateDesk
                </p>
                <p className="text-sm text-neutral-500">
                  Property management for modern teams
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-2xl sm:mt-14 lg:mt-20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                Secure Workspace Access
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl lg:leading-[1.03]">
                Run property operations from one secure workspace.
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
                EstateDesk helps users manage properties, tenants, leases,
                billing, payments, maintenance, inspections, and access control
                in one structured platform.
              </p>
            </div>

            <div className="mt-8 grid gap-3 lg:mt-12">
              {systemHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-black/10 bg-neutral-50 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-neutral-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-neutral-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-3 lg:mt-12">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xl font-semibold">Properties</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Units, buildings, leases
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xl font-semibold">Payments</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Rent, water, tax, receipts
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xl font-semibold">Access</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Role-based dashboards
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-neutral-400">
            <span>Professional</span>
            <span>Reliable</span>
            <span>Structured</span>
          </div>
        </section>

        <section className="min-h-dvh lg:flex lg:min-h-dvh lg:items-center lg:px-14 lg:py-14">
          <div className="w-full">
            <div className="sticky top-0 z-10 border-b border-black/5 bg-white/95 px-4 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] backdrop-blur sm:px-6 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-tight">
                    EstateDesk
                  </p>
                  <p className="text-xs text-neutral-500">
                    Secure role-based login
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-5 lg:px-0 lg:py-0">
              <div className="mx-auto w-full bg-white p-5 sm:max-w-md sm:rounded-[30px] sm:border sm:border-black/10 sm:p-6 sm:shadow-[0_24px_80px_rgba(0,0,0,0.06)] lg:max-w-lg lg:rounded-[34px] lg:p-8">
                <div className="mb-6 lg:hidden">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secure Login
                  </div>

                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Sign in with your email and password to continue.
                  </p>
                </div>

                <div className="mb-8 hidden lg:block">
                  <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-neutral-950" />
                    Secure Login
                  </div>

                  <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">
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
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-neutral-800"
                      >
                        Password
                      </label>

                      <Link
                        href="/forgot-password"
                        className="font-medium text-neutral-500 transition hover:text-neutral-950"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 transition focus-within:border-neutral-950 focus-within:bg-white">
                      <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
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

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <label className="inline-flex items-center gap-3 text-neutral-700">
                      <input
                        type="checkbox"
                        name="remember"
                        className="h-4 w-4 rounded border border-black/20 text-black focus:ring-0"
                      />
                      <span>Remember me</span>
                    </label>
                  </div>

                  {state.error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {state.error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

                <div className="mt-8 rounded-2xl border border-black/10 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-950">
                    What the system does
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Manage properties, people, payments, and permissions in one
                    place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}