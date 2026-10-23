import Link from "next/link";
import { Building2, BedDouble, ArrowUpRight } from "lucide-react";

export function PropertyBrowseHeading({ kind }: { kind: "rentals" | "stays" }) {
  const stays = kind === "stays";
  return <header className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Property search" className="inline-flex max-w-full gap-1 rounded-2xl border border-border bg-muted/60 p-1">
        {[{ href: "/vacancies", label: "Long-term rentals", active: !stays, Icon: Building2 }, { href: "/stays", label: "Short stays", active: stays, Icon: BedDouble }].map(({ href, label, active, Icon }) => <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ${active ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{label}</Link>)}
      </nav>
      <Link href="/login" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">List your property<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
    <div className="max-w-3xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">{stays ? "Stay a little. Feel at home." : "A place for your next chapter."}</p>
      <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">{stays ? "Find a stay that feels like you." : "Find your next home or business space."}</h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{stays ? "Thoughtful spaces for a night, a weekend or a little longer. Compare prices and speak directly with your host." : "Explore available rentals, understand the costs and connect directly with the managing office. Your search starts here."}</p>
    </div>
  </header>;
}
