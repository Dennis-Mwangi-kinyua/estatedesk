import {
  BadgeCheck,
  Building2,
  CreditCard,
  FileArchive,
  Globe2,
  KeyRound,
  Settings2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export const SETTINGS_NAV_ITEMS = [
  {
    id: "organization-profile",
    href: "/dashboard/org/settings/organization-profile",
    label: "Organization Profile",
    description: "Company profile, contact details, timezone, and currency.",
    icon: Building2,
  },
  {
    id: "organization-summary",
    href: "/dashboard/org/settings/organization-summary",
    label: "Organization Summary",
    description: "A quick read-only snapshot of workspace identity and status.",
    icon: BadgeCheck,
  },
  {
    id: "billing",
    href: "/dashboard/org/settings/billing",
    label: "Billing",
    description: "Current plan, renewal date, billing email, and plan changes.",
    icon: CreditCard,
  },
  {
    id: "workspace-preferences",
    href: "/dashboard/org/settings/workspace-preferences",
    label: "Workspace Preferences",
    description: "Theme, modules, tenant portal, issue tracking, and notifications.",
    icon: Settings2,
  },
  {
    id: "payment-instructions",
    href: "/dashboard/org/settings/payment-instructions",
    label: "Payment Instructions",
    description: "M-Pesa and bank instructions shown to tenants at checkout.",
    icon: Wallet,
  },
  {
    id: "users-access",
    href: "/dashboard/org/settings/users-access",
    label: "Users & Access",
    description: "Invite members and review organization roles and status.",
    icon: Users,
  },
  {
    id: "api-keys",
    href: "/dashboard/org/settings/api-keys",
    label: "API Keys",
    description: "Create, review, revoke, and reactivate integration keys.",
    icon: KeyRound,
  },
  {
    id: "contact-region",
    href: "/dashboard/org/settings/contact-region",
    label: "Contact & Region",
    description: "Primary email, phone, address, and timezone details.",
    icon: Globe2,
  },
  {
    id: "security-access",
    href: "/dashboard/org/settings/security-access",
    label: "Security & Access",
    description: "Administrative summary of members, API keys, and renewal status.",
    icon: ShieldCheck,
  },
  {
    id: "data-export",
    href: "/dashboard/org/settings/data-export",
    label: "Data Export",
    description: "Request reviewed CSV archives and download approved exports.",
    icon: FileArchive,
  },
] as const;

export type SettingsSectionId =
  | (typeof SETTINGS_NAV_ITEMS)[number]["id"]
  | "danger-zone"
  | "developer-notes";