import Link from "next/link";
import { ArrowRight, Home, LifeBuoy, Search, ShieldCheck } from "lucide-react";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata;

const serviceLinks = [
  {
    href: "/vacancies",
    title: "Find vacant homes",
    text: "Search available rentals by location, rent, property, and unit type.",
    icon: Search,
  },
  {
    href: "/services",
    title: "Explore EstateDesk services",
    text: "See how EstateDesk handles rent, tenants, leases, issues, inspections, and reports.",
    icon: ShieldCheck,
  },
  {
    href: "/contact",
    title: "Get help",
    text: "Reach the EstateDesk team for onboarding, rollout, and support requests.",
    icon: LifeBuoy,
  },
];

export default function AreYouLostPage() {
  return (
    <main className="min-h-screen bg-[#F2F6FB] text-slate-950 dark:bg-slate-950 dark:text-white">
      <PublicAccessHeader active="home" showPricing />

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/90 sm:p-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
              <Home className="h-4 w-4" />
              Are you lost?
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              This is not a public EstateDesk page.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              API addresses are reserved for secure system communication. You can continue with one of the public services below.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {serviceLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-slate-950/70 dark:hover:border-white/20 dark:hover:bg-slate-900"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold text-slate-950 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.text}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                    Open
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Sign in to workspace
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
