import Link from "@/components/navigation/workspace-link";
import { Building2 } from "@/components/shared/colored-icons";

const groups = [
  { title: "Product", links: [["Overview", "/services"], ["Pricing", "/pricing"], ["For landlords", "/landlord-software"], ["Rent tracking", "/rent-tracking-software"], ["Water billing", "/water-billing-software"]] },
  { title: "Discover", links: [["Long-term rentals", "/vacancies"], ["Short stays", "/stays"], ["Service providers", "/service-providers"], ["List your services", "/service-providers/register"]] },
  { title: "Help & resources", links: [["Guides", "/guides"], ["FAQ", "/faq"], ["Contact & support", "/contact"], ["System status", "/status"], ["Markets", "/property-management-markets"]] },
  { title: "Trust & legal", links: [["Security", "/security"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Data processing", "/data-processing"]] },
];

export function PublicAccessFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="public-access-footer shrink-0 border-t border-border bg-card pb-safe text-card-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {!compact && <div className="grid grid-cols-2 gap-8 pb-8 lg:grid-cols-4">
          {groups.map((group) => <nav key={group.title} aria-label={group.title}><h2 className="text-sm font-semibold">{group.title}</h2><ul className="mt-3 space-y-1">{group.links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center rounded text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</Link></li>)}</ul></nav>)}
        </div>}
        <div className={`flex flex-wrap items-center justify-between gap-4 ${compact ? "" : "border-t border-border pt-6"}`}>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><Building2 aria-hidden="true" className="h-5 w-5 text-primary" />© {new Date().getFullYear()} EstateDesk</Link>
          {compact ? <nav aria-label="Footer" className="flex flex-wrap gap-4">{[["Product", "/services"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]].map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center text-sm hover:underline">{label}</Link>)}</nav> : <p className="text-sm text-muted-foreground">One workspace for your properties and team.</p>}
        </div>
      </div>
    </footer>
  );
}
