import Link from "next/link";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ message?: string }>;

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const message =
    params.message?.trim() ||
    "EstateDesk is temporarily under platform maintenance. Please try again shortly.";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100">
          <Wrench className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Website maintenance
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/login"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
          >
            Back to login
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:border-white/10 dark:text-slate-100"
          >
            Marketing home
          </Link>
        </div>
      </div>
    </div>
  );
}
