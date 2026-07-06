import { Bell, CircleAlert, Wallet } from "lucide-react";

export const DASHBOARD_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Set up portfolio",
    description:
      "Add properties, buildings, and units so occupancy and rent tracking have a clean foundation.",
  },
  {
    step: "02",
    title: "Onboard tenants",
    description:
      "Create tenant records, assign units, and activate leases to start billing periods.",
  },
  {
    step: "03",
    title: "Collect and reconcile",
    description:
      "Verify payments, clear pending balances, and review smart insights for exceptions.",
  },
] as const;

export const DASHBOARD_GUIDANCE = [
  {
    title: "Review smart insights",
    description:
      "See ranked operational actions from live portfolio, ledger, and maintenance signals.",
    href: "/dashboard/org/insights",
    actionLabel: "Open insights",
  },
  {
    title: "Add a property",
    description:
      "Create a new property and unit plan before onboarding tenants or issuing charges.",
    href: "/dashboard/org/properties/new",
    actionLabel: "Create property",
  },
  {
    title: "Open payments desk",
    description:
      "Verify M-Pesa, bank, and cash collections and reconcile tenant balances.",
    href: "/dashboard/org/payments",
    actionLabel: "View payments",
  },
] as const;

export const DASHBOARD_QUICK_LINKS = [
  {
    href: "/dashboard/org/payments",
    title: "Payments",
    description: "Review M-Pesa, bank, and cash collections.",
    icon: Wallet,
  },
  {
    href: "/dashboard/org/issues",
    title: "Issues",
    description: "Handle urgent maintenance and repair follow-ups.",
    icon: CircleAlert,
  },
  {
    href: "/dashboard/org/notifications",
    title: "Notifications",
    description: "Read alerts, reminders, and system activity.",
    icon: Bell,
  },
] as const;