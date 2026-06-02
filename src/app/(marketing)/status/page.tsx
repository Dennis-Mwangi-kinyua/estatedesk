import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "System Status",
  description:
    "EstateDesk system status and production health check information for public pages, dashboards, API health, and operational monitoring.",
  path: "/status",
});

export default function StatusPage() {
  const externalStatusUrl = process.env.NEXT_PUBLIC_STATUS_PAGE_URL;

  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-[#0b0f16] dark:text-slate-100">
      <PublicAccessHeader />
      <section className="border-b border-slate-200 bg-slate-50 py-12 dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            <Activity className="h-3.5 w-3.5" />
            Status
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            EstateDesk system status
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
            EstateDesk exposes production health endpoints for uptime monitors and
            deployment checks. Use this page as the public pointer for availability
            and incident communication.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:px-6 lg:px-8">
          {[
            {
              title: "Public liveness",
              body: "GET /api/health checks the app process and required configuration.",
            },
            {
              title: "Deep readiness",
              body: "GET /api/health?deep=1 also verifies database connectivity.",
            },
            {
              title: "Incident updates",
              body: externalStatusUrl
                ? "A dedicated external status page can be used for public incident updates."
                : "Configure NEXT_PUBLIC_STATUS_PAGE_URL when a dedicated external status page is available.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.body}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {externalStatusUrl ? (
            <Link
              href={externalStatusUrl}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Open external status page
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>
      <PublicAccessFooter />
    </main>
  );
}
