import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { panelShellClassName } from "./profile-ui";

const LINKS = [
  {
    title: "Active sessions",
    description: "Review devices signed in to your account.",
    href: "/dashboard/security",
    label: "Open security",
  },
  {
    title: "Lease & documents",
    description: "Download your lease and view issued records.",
    href: "/dashboard/tenant/documents",
    label: "My documents",
  },
  {
    title: "Payment history",
    description: "Track rent payments and download receipts.",
    href: "/dashboard/tenant/payments",
    label: "View payments",
  },
] as const;

export function ProfileGuidance() {
  return (
    <section className={`${panelShellClassName} p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/20 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Account tools</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Security, documents, and payment records linked to your profile.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {LINKS.map((item) => (
          <div
            key={item.href}
            className="rounded-2xl border border-border bg-muted/10 p-3"
          >
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
            <Link
              href={item.href}
              className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
            >
              {item.label}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}