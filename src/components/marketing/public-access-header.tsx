import Link from "next/link";
import {
  Building2,
  Home,
  LogIn,
  Mail,
  Menu,
  MessageCircleQuestion,
  Search,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";

type PublicAccessHeaderProps = {
  active?: "home" | "vacancies" | "services" | "pricing" | "contact" | "faq";
  loginHref?: string;
  showPricing?: boolean;
};

const publicLinks = [
  { href: "/vacancies", label: "Vacancies", key: "vacancies", icon: Home },
  { href: "/services", label: "Services", key: "services", icon: Search },
  { href: "/pricing", label: "Pricing", key: "pricing", icon: WalletCards },
  { href: "/faq", label: "FAQ", key: "faq", icon: MessageCircleQuestion },
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
  const spacerClassName = "h-16 md:h-[4.1rem]";
  const signInClassName =
    "items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:!border-white/20 dark:!bg-white/[0.10] dark:!text-[#f8fafc] dark:hover:!bg-white/[0.16] dark:focus-visible:ring-white";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] shrink-0 border-b border-slate-200/80 bg-white/95 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b0f16]/95 dark:shadow-none">
        <div className="mx-auto flex h-16 max-w-[1536px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 md:contents">
            <Link
              href="/"
              aria-label="Go to EstateDesk home"
              className="inline-flex min-h-10 min-w-0 items-center gap-2.5 rounded-xl pr-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:text-[#f8fafc] dark:hover:text-[#e5e7eb] dark:focus-visible:ring-white"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-white/12 dark:bg-white/[0.08]">
                <Building2 className="h-5 w-5 text-emerald-700" />
              </span>
              <span className="truncate">EstateDesk</span>
            </Link>

            <details className="group relative md:hidden">
              <summary className="inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] [&::-webkit-details-marker]:hidden">
                <Menu className="h-5 w-5 group-open:hidden" />
                <X className="hidden h-5 w-5 group-open:block" />
                <span className="sr-only">Open menu</span>
              </summary>
              <div className="absolute right-0 top-[3.75rem] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-white/12 dark:bg-[#0b0f16]">
                <nav className="grid gap-2">
                  {visibleLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition ${
                          isActive
                            ? "border-slate-300 bg-slate-950 text-white dark:border-white/20 dark:bg-white dark:text-[#0b0f16]"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-white dark:border-white/12 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/12 dark:bg-white/[0.08]">
                    <span className="text-sm font-semibold text-slate-700 dark:text-white">Theme</span>
                    <HeaderThemeToggle />
                  </div>
                  <Link
                    href={loginHref}
                    className={`inline-flex min-h-11 text-sm ${signInClassName}`}
                  >
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span className="truncate">Sign in</span>
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] [&_*]:text-current"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span className="truncate">Create account</span>
                  </Link>
                </div>
              </div>
            </details>
          </div>

          <nav className="hidden md:flex md:w-auto md:flex-1 md:items-center md:justify-end md:gap-2">
            <div className="flex items-center gap-2">
              {visibleLinks.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`public-access-nav-link inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-2 text-[11px] font-semibold transition sm:min-h-11 sm:flex-row sm:gap-1.5 sm:text-sm md:min-h-10 md:px-3.5 ${
                      isActive
                        ? "public-access-nav-link-active border-slate-300 bg-white text-slate-950 shadow-sm dark:border-white/20 dark:bg-white dark:text-[#0b0f16]"
                        : "border-slate-200/80 bg-slate-50/85 text-slate-950 shadow-sm hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:hover:border-white/25 dark:hover:bg-white/[0.14] dark:hover:text-white md:border-transparent md:bg-transparent md:shadow-none md:dark:border-white/10 md:dark:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-current" />
                    <span className="max-w-full truncate text-current">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-white/10 md:inline-block" />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:items-center">
              <HeaderThemeToggle />
              <Link
                href={loginHref}
                className={`inline-flex min-h-10 min-w-0 text-sm ${signInClassName}`}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                <span className="truncate">Sign in</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] dark:focus-visible:ring-white md:min-h-10 [&_*]:text-current"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                <span className="truncate">Create account</span>
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <div aria-hidden="true" className={spacerClassName} />
    </>
  );
}
