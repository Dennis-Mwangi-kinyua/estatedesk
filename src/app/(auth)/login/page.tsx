"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Building2,
  CreditCard,
  Droplets,
  ClipboardList,
  Users2,
} from "lucide-react";
import { loginAction, type LoginActionState } from "./actions";
import OperationsShowcase from "@/components/marketing/operations-showcase";

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
    <div className="h-dvh overflow-hidden bg-[#eef2f6] text-neutral-950">
      <style jsx>{`
        @keyframes dotGlow {
          0%,
          100% {
            transform: scale(1);
            filter: brightness(1);
            opacity: 0.88;
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          35% {
            transform: scale(1.18);
            filter: brightness(1.18);
            opacity: 1;
            box-shadow:
              0 0 8px currentColor,
              0 0 16px currentColor;
          }
        }
      `}</style>

      <div className="relative h-full overflow-hidden lg:grid lg:grid-cols-[1.12fr_0.88fr]">
        <div className="min-h-0 overflow-hidden">
          <OperationsShowcase />
        </div>

        <main className="relative flex h-full min-h-0 items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <div className="absolute inset-0 lg:hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,#f9fafb_0%,#eef2f6_50%,#e8edf4_100%)]" />
            <div className="absolute left-1/2 top-[-88px] h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
          </div>

          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute right-[12%] top-[14%] h-44 w-44 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="absolute bottom-[12%] right-[18%] h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="absolute inset-[10%] rounded-[40px] border border-white/20" />
          </div>

          <div className="relative z-10 mx-auto flex h-full max-h-full w-full max-w-[500px] min-h-0 flex-col justify-center">
            <div className="mb-3 px-1 lg:hidden">
              <div className="flex w-full items-center rounded-[22px] border border-white/80 bg-white/75 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center text-[15px] font-semibold tracking-[-0.02em] text-neutral-900"
                >
                  <span className="mr-2 text-lg">🏠</span>
                  <span>EstateDesk</span>
                </Link>
              </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-[30px] border border-white/70 bg-white/72 shadow-[0_30px_90px_rgba(15,23,42,0.16),0_10px_25px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-white/40" />
              <div className="pointer-events-none absolute -inset-px rounded-[30px] [box-shadow:0_0_0_1px_rgba(255,255,255,0.18),0_0_25px_rgba(96,165,250,0.08),0_0_45px_rgba(255,255,255,0.12)]" />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-20 rounded-b-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0))]" />
              <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-blue-100/60 blur-2xl" />
              <div className="pointer-events-none absolute -left-8 bottom-10 h-24 w-24 rounded-full bg-cyan-100/50 blur-2xl" />

              <div className="border-b border-neutral-100/80 px-5 pb-4 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
                <div className="mb-3 flex items-center gap-2">
                  {[
                    { color: "#ff5f57", delay: "0s" },
                    { color: "#febc2e", delay: "0.18s" },
                    { color: "#28c840", delay: "0.36s" },
                  ].map((dot, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: dot.color,
                        color: dot.color,
                        animation: "dotGlow 1.4s ease-in-out infinite",
                        animationDelay: dot.delay,
                        boxShadow: "0 0 0 rgba(255,255,255,0)",
                      }}
                    />
                  ))}
                </div>

                <Link
                  href="/services"
                  className="group relative mb-4 block overflow-hidden rounded-[24px] p-[1px] lg:hidden"
                >
                  <div className="absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,rgba(59,130,246,0.42),rgba(255,255,255,0.94),rgba(14,165,233,0.24))]" />
                  <div className="relative rounded-[23px] border border-[#dbeafe] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.08)] transition duration-300 group-hover:-translate-y-[1px] group-hover:shadow-[0_16px_30px_rgba(37,99,235,0.11)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0b1720] text-white shadow-sm">
                          <Building2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
                            Platform overview
                          </p>
                          <h3 className="mt-1 text-[14px] font-semibold tracking-[-0.02em] text-neutral-950">
                            Explore our services
                          </h3>
                          <p className="mt-1.5 text-xs leading-5 text-neutral-600">
                            Rent, water bills, inspections, staff, and more.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-full bg-white p-2 text-[#2563eb] shadow-sm transition duration-300 group-hover:translate-x-0.5">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <CreditCard className="h-3.5 w-3.5 text-neutral-500" />
                        Rent
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <Droplets className="h-3.5 w-3.5 text-neutral-500" />
                        Water Bills
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <ClipboardList className="h-3.5 w-3.5 text-neutral-500" />
                        Inspections
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-3 py-2 text-[11px] font-medium text-neutral-700">
                        <Users2 className="h-3.5 w-3.5 text-neutral-500" />
                        Staff
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/60 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-600 shadow-sm backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure sign in
                </div>

                <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-neutral-950 sm:text-[32px]">
                  Welcome back
                </h2>

                <p className="mt-2 max-w-md text-sm leading-5 text-neutral-600">
                  Sign in to manage your workspace, property operations,
                  billing workflows, and daily team activity.
                </p>
              </div>

              <div className="px-5 py-4 sm:px-6 sm:py-5">
                <form action={formAction} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-neutral-800"
                    >
                      Email address
                    </label>

                    <div className="group flex min-h-[54px] items-center gap-3 rounded-[18px] border border-neutral-200/90 bg-[#f8fafc]/90 px-4 transition duration-200 focus-within:border-[#0b1720] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.04)]">
                      <Mail className="h-4 w-4 shrink-0 text-neutral-400 transition group-focus-within:text-neutral-700" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        className="w-full bg-transparent text-[15px] text-neutral-950 outline-none placeholder:text-neutral-400"
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

                    <div className="group flex min-h-[54px] items-center gap-3 rounded-[18px] border border-neutral-200/90 bg-[#f8fafc]/90 px-4 transition duration-200 focus-within:border-[#0b1720] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.04)]">
                      <LockKeyhole className="h-4 w-4 shrink-0 text-neutral-400 transition group-focus-within:text-neutral-700" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-[15px] text-neutral-950 outline-none placeholder:text-neutral-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="shrink-0 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
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

                  <div className="flex items-center justify-between gap-4 pt-1">
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
                    <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {globalError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#0b1720] px-5 py-4 text-sm font-medium text-white shadow-[0_18px_30px_rgba(11,23,32,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#10202c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{isPending ? "Signing in..." : "Sign in"}</span>
                    {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </form>

                <div className="mt-5 border-t border-neutral-100/80 pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-neutral-600">
                      Need an account?
                      <Link
                        href="/register"
                        className="ml-1.5 font-medium text-neutral-950 transition hover:opacity-70"
                      >
                        Create one
                      </Link>
                    </p>

                    <div className="inline-flex items-center gap-2 text-xs text-neutral-500">
                      <ShieldCheck className="h-4 w-4" />
                      Protected sign-in
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 text-center text-[11px] text-neutral-500 lg:hidden">
              © {new Date().getFullYear()} EstateDesk
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}