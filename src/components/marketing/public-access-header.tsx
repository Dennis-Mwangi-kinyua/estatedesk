import Link from "next/link";
import {
  Building2,
  Home,
  LogIn,
  Mail,
  Search,
  UserPlus,
  WalletCards,
} from "lucide-react";

type PublicAccessHeaderProps = {
  active?: "home" | "vacancies" | "services" | "pricing" | "contact";
  loginHref?: string;
  showPricing?: boolean;
};

const publicLinks = [
  { href: "/vacancies", label: "Vacancies", key: "vacancies", icon: Home },
  { href: "/services", label: "Services", key: "services", icon: Search },
  { href: "/pricing", label: "Pricing", key: "pricing", icon: WalletCards },
  { href: "/contact", label: "Contact", key: "contact", icon: Mail },
] as const;

export function PublicAccessHeader({
  active = "home",
  loginHref = "/login",
  showPricing = true,
}: PublicAccessHeaderProps) {
  const visibleLinks = showPricing
    ? publicLinks
    : publicLinks.filter((item) => item.key !== "pricing");
  const mobileLinkGridClass = showPricing ? "grid-cols-2" : "grid-cols-3";

  return (
    <header className="z-40 shrink-0 border-b border-slate-200/80 bg-white/95 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 dark:shadow-none">
      <div className="mx-auto flex max-w-[1536px] flex-col gap-2.5 px-3 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-5 md:py-2.5 lg:px-8">
        <div className="flex items-center justify-between gap-2 md:contents">
          <Link
            href="/"
            aria-label="Go to EstateDesk home"
            className="inline-flex min-h-10 min-w-0 items-center gap-2.5 rounded-xl pr-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:text-white dark:hover:text-slate-200 dark:focus-visible:ring-white"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <Building2 className="h-5 w-5 text-emerald-700" />
            </span>
            <span className="truncate">EstateDesk</span>
          </Link>

          <Link
            href={loginHref}
            className="inline-flex min-h-10 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-white sm:text-sm md:hidden"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span className="truncate">Sign in</span>
          </Link>
        </div>

        <nav className="grid w-full gap-2 md:flex md:w-auto md:flex-1 md:items-center md:justify-end">
          <div className={`grid ${mobileLinkGridClass} gap-2 md:flex md:items-center`}>
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-2 text-[11px] font-semibold transition sm:min-h-11 sm:flex-row sm:gap-1.5 sm:text-sm md:min-h-10 md:px-3.5 ${
                    isActive
                      ? "border-slate-300 bg-white text-slate-950 shadow-sm dark:border-white/15 dark:bg-slate-900 dark:text-white"
                      : "border-slate-200/80 bg-slate-50/85 text-slate-600 shadow-sm hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-slate-800 dark:hover:text-white md:border-transparent md:bg-transparent md:shadow-none md:dark:bg-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-white/10 md:inline-block" />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:items-center">
            <Link
              href={loginHref}
              className="hidden min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/85 px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-white md:inline-flex"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span className="truncate">Sign in</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-white md:min-h-10"
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              <span className="truncate">Create account</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
