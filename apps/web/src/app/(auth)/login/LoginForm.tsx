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
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import styles from "./login.module.css";
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
    <div className={`${styles.field} group`}>
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
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        @keyframes loginCardEnter { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes loginProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(340%); } }
        .login-loading-ring { animation: loginSpin 1.1s linear infinite; }
        .login-auth-card { animation: loginCardEnter .25s ease-out both; }
        .login-auth-progress { animation: loginProgress 1.8s ease-in-out infinite; }
        .login-auth-overlay {
          position: fixed; inset: 0; z-index: 9999; display: grid;
          min-height: 100vh; min-height: 100dvh; place-items: center;
          background: rgba(15, 23, 42, .42);
          -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
        }
        @media (prefers-reduced-motion: reduce) {
          .login-loading-ring, .login-auth-card, .login-auth-progress { animation: none; }
        }
      `}</style>

      {isPending && typeof document !== "undefined"
        ? createPortal(
        <div className={`${styles.loadingOverlay} login-auth-overlay px-5`} role="status" aria-live="polite" aria-atomic="true">
          <div className={`${styles.loadingCard} login-auth-card w-full max-w-[340px] rounded-3xl border border-white/80 bg-white px-8 py-8 text-center shadow-[0_28px_90px_rgba(15,23,42,0.25)]`}>
            <div aria-hidden="true" className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-slate-100" />
              <div className="login-loading-ring absolute inset-0 rounded-full border-[3px] border-transparent border-r-teal-200 border-t-teal-600" />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.7} />
              </div>
            </div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-700">Secure sign-in</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Verifying details</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Please wait while we securely log you in.</p>
            <div aria-hidden="true" className="mt-6 h-1 overflow-hidden rounded-full bg-slate-100">
              <div className="login-auth-progress h-full w-1/3 rounded-full bg-gradient-to-r from-teal-300 to-teal-600" />
            </div>
          </div>
        </div>,
          document.body,
        )
        : null}

      <div className={styles.form}>
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
                className={styles.input}
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
                className={styles.input}
              />

              <button
                type="button"
                onClick={togglePassword}
                disabled={isPending}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
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
            className={styles.submit}
          >
            <span>{isPending ? "Verifying..." : "Log in"}</span>
            {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </form>

        <div className={styles.formFooter}>
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

            <div className={styles.protected}>
              <ShieldCheck className="h-4 w-4 text-slate-700" />
              Protected
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
