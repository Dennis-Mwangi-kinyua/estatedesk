import Link from "next/link";
import {
  Bell,
  CreditCard,
  Droplets,
  FileText,
  FolderOpen,
  Receipt,
  UserRound,
  Wrench,
} from "lucide-react";
import { panelShellClassName } from "./tenant-dashboard-ui";

const ACTIONS = [
  { href: "/dashboard/tenant/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/tenant/water-bills", label: "Water bills", icon: Droplets },
  { href: "/dashboard/tenant/lease", label: "Lease", icon: FileText },
  { href: "/dashboard/tenant/issues", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/tenant/invoice", label: "Invoices", icon: Receipt },
  { href: "/dashboard/tenant/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/tenant/documents", label: "Documents", icon: FolderOpen },
  { href: "/dashboard/tenant/profile", label: "Profile", icon: UserRound },
] as const;

export function TenantDashboardQuickActions() {
  return (
    <section className={`${panelShellClassName} p-4 sm:p-5`}>
      <h2 className="text-sm font-semibold text-foreground">Quick navigation</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Jump directly to a workspace section.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex h-11 items-center gap-3 rounded-2xl border border-border bg-muted/10 px-4 text-sm font-medium text-foreground transition hover:bg-muted/25"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}