import Link from "next/link";
import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import OperationsShowcase from "@/components/marketing/operations-showcase";
import LoginForm from "./LoginForm";

const trustItems = [
  "Role-based access",
  "Audit-ready records",
  "Secure workspace sessions",
] as const;

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <aside className="hidden min-h-dvh border-r border-slate-200 bg-white lg:block">
        <OperationsShowcase compact />
      </aside>

      <main className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <section className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Go to EstateDesk home"
              className="inline-flex items-center gap-3 rounded-lg text-sm font-semibold text-slate-950 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-5 w-5" />
              </span>
              <span>EstateDesk</span>
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure access
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-200 px-5 py-6 sm:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Workspace sign in
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in to manage properties, billing, tenants, staff, and
                operational records.
              </p>
            </div>

            <LoginForm />
          </div>

          <div className="mt-6 grid gap-2 text-sm text-slate-600">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
