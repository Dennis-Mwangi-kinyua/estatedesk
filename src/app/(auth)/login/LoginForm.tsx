"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRight,
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

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  const globalError = state?.error ?? null;

  return (
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
            <p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
  );
}