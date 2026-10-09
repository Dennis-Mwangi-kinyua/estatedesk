import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Droplets,
  FileText,
  FolderOpen,
  UserRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { panelShellClassName } from "./tenant-dashboard-ui";

const ACTIONS = [
  { href: "/dashboard/tenant/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/tenant/water-bills", label: "Water bills", icon: Droplets },
  { href: "/dashboard/tenant/lease", label: "My lease", icon: FileText },
  { href: "/dashboard/tenant/issues", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/tenant/invoice", label: "Invoices", icon: FileText },
  { href: "/dashboard/tenant/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/tenant/documents", label: "Documents", icon: FolderOpen },
  { href: "/dashboard/tenant/profile", label: "Profile", icon: UserRound },
] as const;

export function TenantDashboardQuickActions() {
  return (
    <section className={`${panelShellClassName} p-4 sm:p-5`}>
      <h2 className="text-sm font-semibold text-foreground">Your shortcuts</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Bills, documents, and updates in one place.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((action) => {
          const Icon: LucideIcon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group workspace-action flex min-h-20 min-w-0 flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-background p-3 text-left text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 sm:min-h-24 sm:p-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.9} />
              </span>
              <span className="flex w-full min-w-0 items-center justify-between gap-1 lg:flex-1">
                <span className="min-w-0 break-words leading-5">{action.label}</span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
