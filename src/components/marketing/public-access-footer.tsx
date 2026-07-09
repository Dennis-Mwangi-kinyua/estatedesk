import Link from "next/link";
import { Building2, Home, MessageCircleQuestion, Search, ShieldCheck } from "lucide-react";

const footerLinks = [
  { href: "/vacancies", label: "Vacancies" },
  { href: "/services", label: "Services" },
  { href: "/property-management-software-kenya", label: "Kenya" },
  { href: "/landlord-software", label: "Landlords" },
  { href: "/rent-tracking-software", label: "Rent tracking" },
  { href: "/water-billing-software", label: "Water billing" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/status", label: "Status" },
] as const;

const footerHighlights = [
  { icon: Home, label: "Vacancies" },
  { icon: Search, label: "Discovery" },
  { icon: ShieldCheck, label: "Records" },
] as const;

export function PublicAccessFooter() {
  return (
    <footer className="shrink-0 border-t border-neutral-200/80 bg-white/92 pb-safe text-neutral-950 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b0f16]/95 dark:text-[#f8fafc]">
      <div className="mx-auto grid max-w-[1536px] gap-3 px-3 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Go to EstateDesk home"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl pr-1 text-xs font-bold uppercase tracking-[0.14em] transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:hover:text-[#e5e7eb] dark:focus-visible:ring-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-white/[0.08]">
              <Building2 className="h-4 w-4 text-emerald-700" />
            </span>
            EstateDesk
          </Link>
          <p className="hidden min-w-0 truncate text-xs font-medium text-neutral-500 dark:text-[#e5e7eb] sm:block">
            Professional rental discovery and clear tenant records.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:flex md:items-center">
          {footerHighlights.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 px-2 text-xs font-semibold text-neutral-700 dark:border-white/15 dark:bg-white/[0.10] dark:text-[#f8fafc]"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
              <span className="truncate">{label}</span>
            </span>
          ))}
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:col-span-2 lg:col-span-1 lg:flex lg:flex-wrap lg:items-center lg:justify-end">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-10 min-w-0 items-center justify-center rounded-xl border border-transparent px-2.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-white/12 dark:bg-white/[0.10] dark:text-[#f8fafc] dark:hover:border-white/25 dark:hover:bg-white/[0.16] dark:focus-visible:ring-white"
            >
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
          <Link
            href="/faq"
            className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-white/12 dark:bg-white/[0.10] dark:text-[#f8fafc] dark:hover:border-white/25 dark:hover:bg-white/[0.16] dark:focus-visible:ring-white"
          >
            <MessageCircleQuestion className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
            <span className="truncate">Help</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
