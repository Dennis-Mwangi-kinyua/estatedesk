"use client";

import Link from "next/link";
import {
  memo,
  useActionState,
  useCallback,
  useState,
  type ReactNode,
} from "react";
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

const InputShell = memo(function InputShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="group flex min-h-[46px] items-center gap-3 rounded-[17px] border border-slate-200/90 bg-[#F8FAFC]/95 px-3.5 transition duration-200 focus-within:border-[#007AFF] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,122,255,0.10)] sm:min-h-[54px] sm:rounded-[18px] sm:px-4">
      {children}
    </div>
  );
});

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  const [showPassword, setShowPassword] = useState(false);

  const globalError = state?.error ?? null;

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <>
      <style>{`
        @keyframes loginSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes loadingDot {
          0%, 80%, 100% {
            transform: scale(0.72);
            opacity: 0.35;
          }

          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .login-loading-ring {
          animation: loginSpin 0.85s linear infinite;
        }

        .login-loading-dot {
          animation: loadingDot 1.1s ease-in-out infinite;
        }

        @media (max-height: 740px) {
          .login-form-compact {
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .login-form-stack {
            gap: 12px;
          }

          .login-field-stack {
            gap: 6px;
          }

          .login-form-label {
            font-size: 13px;
          }

          .login-form-meta {
            margin-top: 12px;
            padding-top: 12px;
          }
        }

        @media (max-height: 660px) {
          .login-form-compact {
            padding-top: 10px;
            padding-bottom: 10px;
          }

          .login-form-stack {
            gap: 10px;
          }

          .remember-row {
            display: none;
          }

          .login-form-meta {
            display: none;
          }
        }

        @media (max-height: 590px) {
          .login-form-label {
            display: none;
          }

          .login-form-stack {
            gap: 8px;
          }
        }
      `}</style>

      {isPending ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/35 px-6 backdrop-blur-xl">
          <div className="w-full max-w-[280px] rounded-[32px] border border-white/85 bg-white/88 px-6 py-7 text-center shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#007AFF] shadow-[0_18px_35px_rgba(0,122,255,0.30)]">
              <div className="login-loading-ring h-8 w-8 rounded-full border-[3px] border-white/30 border-t-white" />
            </div>

            <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-slate-950">
              Verifying details
            </h3>

            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              Please wait while we securely log you in.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="login-loading-dot h-2.5 w-2.5 rounded-full bg-[#007AFF]" />
              <span className="login-loading-dot h-2.5 w-2.5 rounded-full bg-[#007AFF] [animation-delay:0.16s]" />
              <span className="login-loading-dot h-2.5 w-2.5 rounded-full bg-[#007AFF] [animation-delay:0.32s]" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="login-form-compact px-4 py-3 sm:px-6 sm:py-5">
        <form
          action={formAction}
          className="login-form-stack flex flex-col gap-3 sm:gap-4"
        >
          <div className="login-field-stack flex flex-col gap-2">
            <label
              htmlFor="email"
              className="login-form-label text-sm font-medium text-slate-800"
            >
              Email address
            </label>

            <InputShell>
              <Mail className="h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-[#007AFF]" />

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.email?.length)}
                className="h-full w-full bg-transparent text-[16px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[15px]"
              />
            </InputShell>

            {state.fieldErrors?.email?.length ? (
              <p className="text-xs font-medium text-red-600 sm:text-sm">
                {state.fieldErrors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="login-field-stack flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="login-form-label text-sm font-medium text-slate-800"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#007AFF] transition hover:text-[#0057D9] sm:text-sm"
              >
                Forgot password?
              </Link>
            </div>

            <InputShell>
              <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-[#007AFF]" />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={isPending}
                aria-invalid={Boolean(state.fieldErrors?.password?.length)}
                className="h-full w-full bg-transparent text-[16px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[15px]"
              />

              <button
                type="button"
                onClick={togglePassword}
                disabled={isPending}
                className="shrink-0 rounded-full p-2 text-slate-400 transition active:scale-95 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </InputShell>

            {state.fieldErrors?.password?.length ? (
              <p className="text-xs font-medium text-red-600 sm:text-sm">
                {state.fieldErrors.password[0]}
              </p>
            ) : null}
          </div>

          <div className="remember-row flex items-center justify-between gap-3 pt-0.5">
            <label className="inline-flex items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                name="remember"
                disabled={isPending}
                className="h-4 w-4 rounded border-slate-300 text-[#007AFF] focus:ring-[#007AFF] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span>Remember me</span>
            </label>
          </div>

          {globalError ? (
            <div className="rounded-[17px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-red-700 sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-sm">
              {globalError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[17px] bg-[#007AFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(0,122,255,0.28)] transition duration-200 active:scale-[0.99] hover:bg-[#0057D9] disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[54px] sm:rounded-[18px] sm:py-4"
          >
            <span>{isPending ? "Verifying..." : "Log in"}</span>
            {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </form>

        <div className="login-form-meta mt-4 border-t border-slate-100/90 pt-4 sm:mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Need an account?
              <Link
                href="/register"
                className="ml-1.5 font-semibold text-[#007AFF] transition hover:text-[#0057D9]"
              >
                Create one
              </Link>
            </p>

            <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex">
              <ShieldCheck className="h-4 w-4 text-[#007AFF]" />
              Protected
            </div>
          </div>
        </div>
      </div>
    </>
  );
}