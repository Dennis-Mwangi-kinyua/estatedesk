"use client";

import Link from "next/link";
import {
  memo,
  useActionState,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import type { LoginActionState } from "./actions";

type LoginActionHandler = (
  prevState: LoginActionState,
  formData: FormData,
) => Promise<LoginActionState>;

const initialState: LoginActionState = {
  success: false,
};

const InputShell = memo(function InputShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="group flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 transition duration-150 focus-within:border-slate-950 focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.10)] sm:min-h-12 sm:px-3.5">
      {children}
    </div>
  );
});

export default function LoginForm({
  returnTo,
  loginAction,
}: {
  returnTo?: string;
  loginAction: LoginActionHandler;
}) {
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

        .login-auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          min-height: 100vh;
          min-height: 100dvh;
          place-items: center;
          background:
            radial-gradient(circle at center, rgba(255, 255, 255, 0.18), transparent 34%),
            rgba(15, 23, 42, 0.38);
          -webkit-backdrop-filter: blur(14px) saturate(1.08);
          backdrop-filter: blur(14px) saturate(1.08);
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

      {isPending && typeof document !== "undefined"
        ? createPortal(
        <div className="login-auth-overlay px-5">
          <div className="w-full max-w-[300px] rounded-2xl border border-white/80 bg-white/92 px-6 py-7 text-center shadow-[0_28px_90px_rgba(15,23,42,0.28)] ring-1 ring-slate-950/5 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_16px_36px_rgba(15,23,42,0.22)]">
              <div className="login-loading-ring h-9 w-9 rounded-full border-[3px] border-white/30 border-t-white" />
            </div>

            <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">
              Verifying details
            </h3>

            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              Please wait while we securely log you in.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="login-loading-dot h-2.5 w-2.5 rounded-full bg-slate-950" />
              <span className="login-loading-dot h-2.5 w-2.5 rounded-full bg-slate-950 [animation-delay:0.16s]" />
              <span className="login-loading-dot h-2.5 w-2.5 rounded-full bg-slate-950 [animation-delay:0.32s]" />
            </div>
          </div>
        </div>,
          document.body,
        )
        : null}

      <div className="px-5 py-6 sm:px-7">
        <form action={formAction} className="flex flex-col gap-4">
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-800">
              Email or username
            </label>

            <InputShell>
              <Mail className="h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-slate-950" />

              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                placeholder="you@company.com or landlord01"
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-800"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-slate-950 underline-offset-4 transition hover:underline sm:text-sm"
              >
                Forgot password?
              </Link>
            </div>

            <InputShell>
              <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-slate-950" />

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
                className="shrink-0 rounded-md p-2 text-slate-400 transition active:scale-95 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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

          {globalError ? (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-red-700 sm:px-4 sm:py-3 sm:text-sm"
            >
              {globalError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition duration-150 active:scale-[0.99] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-12"
          >
            <span>{isPending ? "Verifying..." : "Log in"}</span>
            {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Need an account?
              <Link
                href="/register"
                className="ml-1.5 font-semibold text-slate-950 underline-offset-4 transition hover:underline"
              >
                Create one
              </Link>
            </p>

            <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex">
              <ShieldCheck className="h-4 w-4 text-slate-700" />
              Protected
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
