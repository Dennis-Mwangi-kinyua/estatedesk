import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type SecurityGateShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
};

function BlurredHomepageBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6f1_42%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0d1117_0%,#101923_48%,#0d1117_100%)]">
      <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-emerald-300/35 blur-3xl dark:bg-emerald-500/15" />
      <div className="absolute right-[-4rem] top-32 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/12" />
      <div className="absolute bottom-12 left-[18%] h-64 w-64 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-500/10" />

      <div className="security-gate-backdrop absolute inset-[8%] hidden lg:block">
        <div className="grid h-full grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-5">
          <div className="space-y-4">
            <div className="h-28 rounded-[28px] border border-white/70 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-36 rounded-[24px] border border-white/70 bg-white/75 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5" />
              <div className="h-36 rounded-[24px] border border-white/70 bg-white/75 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5" />
            </div>
            <div className="h-44 rounded-[28px] border border-white/70 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="space-y-4">
            <div className="h-40 rounded-[24px] border border-emerald-200/70 bg-emerald-50/80 shadow-[0_16px_40px_rgba(16,185,129,0.08)] dark:border-emerald-500/15 dark:bg-emerald-500/10" />
            <div className="h-52 rounded-[28px] border border-white/70 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5" />
            <div className="h-32 rounded-[24px] border border-white/70 bg-white/75 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SecurityGateShell({
  children,
  eyebrow = "Account security",
  title,
  description,
}: SecurityGateShellProps) {
  return (
    <div className="security-gate-screen fixed inset-0 z-[120] min-h-screen w-full overflow-hidden text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <BlurredHomepageBackdrop />
        <div className="security-gate-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Building2 className="h-4 w-4 text-emerald-700" />
              </span>
              EstateDesk
            </Link>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Secure access
            </span>
          </div>

          <section className="security-gate-panel rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:p-6 dark:border-white/12 dark:bg-slate-950/88 dark:text-slate-50">
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </div>

            {children}
          </section>
        </div>
      </div>
    </div>
  );
}