import Link from "next/link";
import { SidebarSticker } from "@/components/shared/sidebar-sticker";
import { panelShellClassName } from "./tenant-dashboard-ui";

const ACTIONS = [
  { href: "/dashboard/tenant/payments", label: "Payments" },
  { href: "/dashboard/tenant/water-bills", label: "Water bills" },
  { href: "/dashboard/tenant/lease", label: "Lease" },
  { href: "/dashboard/tenant/issues", label: "Maintenance" },
  { href: "/dashboard/tenant/invoice", label: "Invoices" },
  { href: "/dashboard/tenant/notifications", label: "Notifications" },
  { href: "/dashboard/tenant/documents", label: "Documents" },
  { href: "/dashboard/tenant/profile", label: "Profile" },
] as const;

export function TenantDashboardQuickActions() {
  return (
    <section className={`${panelShellClassName} p-4 sm:p-5`}>
      <h2 className="text-sm font-semibold text-foreground">Your shortcuts</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Bills, documents, and updates in one place.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {ACTIONS.map((action) => {

          return (
            <Link
              key={action.href}
              href={action.href}
              className="workspace-action inline-flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-muted/10 px-4 text-sm font-medium text-foreground transition hover:bg-muted/25"
            >
              <SidebarSticker href={action.href} />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}