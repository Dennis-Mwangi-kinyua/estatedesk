import Link from "next/link";
import { Building2, Home, Mail, Search, ShieldCheck } from "lucide-react";

const footerLinks = [
  { href: "/vacancies", label: "Vacancies" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
] as const;

const footerHighlights = [
  { icon: Home, label: "Vacancies" },
  { icon: Search, label: "Discovery" },
  { icon: ShieldCheck, label: "Records" },
] as const;

export function PublicAccessFooter() {
  return (
    <footer className="shrink-0 border-t border-neutral-200/80 bg-white/92 text-neutral-950 backdrop-blur-2xl">
      <div className="mx-auto grid max-w-[1536px] gap-3 px-3 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Go to EstateDesk home"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl pr-1 text-xs font-bold uppercase tracking-[0.14em] transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
              <Building2 className="h-4 w-4 text-emerald-700" />
            </span>
            EstateDesk
          </Link>
          <p className="hidden min-w-0 truncate text-xs text-neutral-500 sm:block">
            Professional rental discovery and clear tenant records.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:flex md:items-center">
          {footerHighlights.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 px-2 text-xs font-semibold text-neutral-700"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="truncate">{label}</span>
            </span>
          ))}
        </div>

        <nav className="grid grid-cols-4 gap-2 md:col-span-2 lg:col-span-1 lg:flex lg:items-center lg:justify-end">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-9 min-w-0 items-center justify-center rounded-xl px-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
          <Link
            href="/contact"
            className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            <span className="truncate">Talk</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
