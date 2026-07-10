import {
  Banknote,
  Building2,
  Droplets,
  RefreshCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { InsightDomain } from "@/features/insights/lib/smart-insights";

export const INSIGHTS_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Scan portfolio score",
    description:
      "Review collection rate, occupancy, and priority actions for the current billing period.",
  },
  {
    step: "02",
    title: "Act on recommendations",
    description:
      "Work through ranked exceptions from ledger, payments, leases, and maintenance queues.",
  },
  {
    step: "03",
    title: "Monitor domain health",
    description:
      "Track collections, reconciliation, occupancy, maintenance, leases, and water separately.",
  },
] as const;

export const INSIGHTS_GUIDANCE = [
  {
    title: "Open payments desk",
    description:
      "Verify pending payments and reconcile tenant balances against the current ledger.",
    href: "/dashboard/org/payments",
    actionLabel: "View payments",
  },
  {
    title: "Review open issues",
    description:
      "Clear urgent maintenance tickets and unassigned repair follow-ups.",
    href: "/dashboard/org/issues",
    actionLabel: "Open issues",
  },
  {
    title: "Check vacancy pipeline",
    description:
      "Review vacant units and stale listings before the next billing cycle.",
    href: "/dashboard/org/units?status=VACANT",
    actionLabel: "View vacant units",
  },
] as const;

export const INSIGHT_DOMAIN_META: Record<
  InsightDomain,
  { label: string; icon: typeof Banknote }
> = {
  COLLECTIONS: { label: "Collections", icon: Banknote },
  RECONCILIATION: { label: "Reconciliation", icon: ShieldCheck },
  OCCUPANCY: { label: "Occupancy", icon: Building2 },
  MAINTENANCE: { label: "Maintenance", icon: Wrench },
  LEASES: { label: "Leases", icon: RefreshCcw },
  WATER: { label: "Water", icon: Droplets },
};