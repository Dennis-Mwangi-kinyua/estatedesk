import Link from "next/link";
import { Building2, Mail, ShieldAlert } from "lucide-react";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata;

type PageProps = {
  searchParams?: Promise<{
    organization?: string;
  }>;
};

export default async function ServiceTerminatedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const organization = params?.organization?.trim();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <PublicAccessHeader showPricing={false} />

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Service unavailable
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            EstateDesk services have been terminated for this organization.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {organization ? `${organization} is no longer active on EstateDesk. ` : null}
            Access to dashboards, tenant tools, staff workflows, and organization records is currently disabled.
          </p>

          <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
            <div className="flex gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Contact your organization owner or administrator if you believe this is a mistake.</p>
            </div>
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <p>For platform support, contact EstateDesk with your organization name and login email.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            >
              Contact support
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            >
              Return home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
