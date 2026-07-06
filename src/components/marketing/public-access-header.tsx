"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
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
  active?: "home" | "vacancies" | "services" | "pricing" | "contact" | "faq" | "guides";
  loginHref?: string;
  showPricing?: boolean;
};

const publicLinks = [
  { href: "/vacancies", label: "Vacancies", key: "vacancies", icon: Home },
  { href: "/services", label: "Services", key: "services", icon: Search },
  { href: "/pricing", label: "Pricing", key: "pricing", icon: WalletCards },
  { href: "/guides", label: "Guides", key: "guides", icon: BookOpen },
  { href: "/faq", label: "FAQ", key: "faq", icon: MessageCircleQuestion },
  { href: "/contact", label: "Contact", key: "contact", icon: Mail },
] as const;

export function PublicAccessHeader({
  active = "home",
  loginHref = "/login",
  showPricing = true,
}: PublicAccessHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const visibleLinks = showPricing
    ? publicLinks
    : publicLinks.filter((item) => item.key !== "pricing");
  const spacerClassName = "h-16 md:h-[4.1rem]";
  const signInClassName =
    "items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:!border-white/20 dark:!bg-white/[0.10] dark:!text-[#f8fafc] dark:hover:!bg-white/[0.16] dark:focus-visible:ring-white";

  useEffect(() => {
    if (!isMenuOpen) return;

    document.documentElement.classList.add("public-mobile-menu-open");

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.classList.remove("public-mobile-menu-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] shrink-0 border-b border-slate-200/80 bg-white/95 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1117]/95 dark:shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
        <div className="mx-auto flex h-16 max-w-[1536px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          <div className="flex w-full items-center justify-between gap-2 lg:contents">
            <Link
              href="/"
              aria-label="Go to EstateDesk home"
              className="inline-flex min-h-10 min-w-0 items-center gap-2.5 rounded-lg pr-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:text-[#f8fafc] dark:hover:text-[#e5e7eb] dark:focus-visible:ring-white"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10">
                <Building2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </span>
              <span className="truncate">EstateDesk</span>
            </Link>

            <div ref={mobileMenuRef} className="relative lg:hidden">
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="public-access-mobile-menu"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-white/18 dark:bg-white/[0.10] dark:text-white dark:hover:border-white/28 dark:hover:bg-white/[0.16] dark:focus-visible:ring-white"
              >
                <Menu className={`h-5 w-5 ${isMenuOpen ? "hidden" : "block"}`} />
                <X className={`h-5 w-5 ${isMenuOpen ? "block" : "hidden"}`} />
              </button>
              {isMenuOpen ? (
                <div className="fixed inset-x-0 bottom-0 top-16 z-[105] bg-white/68 backdrop-blur-2xl dark:bg-[#05080d]/82" />
              ) : null}
              <div
                id="public-access-mobile-menu"
                hidden={!isMenuOpen}
                className="fixed right-3 top-20 z-[110] w-[min(21rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.22)] dark:border-white/20 dark:bg-[#111821] dark:shadow-[0_24px_70px_rgba(0,0,0,0.52)]"
              >
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/16 dark:bg-[#18202a]">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                      Menu
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                      EstateDesk public pages
                    </p>
                  </div>
                  <HeaderThemeToggle className="h-9 w-9 rounded-lg" />
                </div>

                <nav className="mt-3 grid gap-1.5">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    Explore
                  </p>
                  {visibleLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`inline-flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 text-sm font-semibold transition ${
                          isActive
                            ? "border-slate-300 bg-slate-950 text-white dark:border-emerald-300/45 dark:bg-emerald-400/18 dark:text-emerald-50"
                            : "border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:bg-slate-50 dark:border-white/18 dark:bg-[#18202a] dark:text-slate-50 dark:hover:border-white/30 dark:hover:bg-[#202a36]"
                        }`}
                      >
                        <span className="inline-flex min-w-0 items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0 text-current" />
                          <span className="truncate text-current">{item.label}</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-current opacity-60" />
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    Account
                  </p>
                  <Link
                    href={loginHref}
                    onClick={() => setIsMenuOpen(false)}
                    className={`inline-flex min-h-11 text-sm ${signInClassName}`}
                  >
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span className="truncate">Sign in</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-emerald-400 dark:text-[#07130f] dark:hover:bg-emerald-300 [&_*]:text-current"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span className="truncate">Create account</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex lg:w-auto lg:flex-1 lg:items-center lg:justify-end lg:gap-2">
            <div className="flex items-center gap-2">
              {visibleLinks.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`public-access-nav-link inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition xl:px-3.5 ${
                      isActive
                        ? "public-access-nav-link-active border-slate-300 bg-white text-slate-950 shadow-sm dark:border-white/20 dark:bg-white dark:text-[#0b0f16]"
                        : "border-transparent bg-transparent text-slate-950 hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-white/25 dark:hover:bg-white/[0.14] dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-current" />
                    <span className="max-w-full truncate text-current">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-white/10 md:inline-block" />

            <div className="flex items-center gap-2">
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
                className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] dark:focus-visible:ring-white [&_*]:text-current"
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
