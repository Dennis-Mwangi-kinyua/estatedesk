import { guidePublicIndexItems } from "@/lib/guides";
import { absoluteUrl } from "@/lib/seo";

export type PublicSiteIndexItem = {
  title: string;
  path: string;
  description: string;
  priority: string;
  changefreq: "daily" | "weekly" | "monthly";
  lastmod?: string;
};

export const publicSiteIndexItems: readonly PublicSiteIndexItem[] = [
  {
    title: "Home",
    path: "/",
    description:
      "EstateDesk — best property management software for Kenya: M-Pesa rent, water billing, KRA eTIMS-ready receipts, accounting, caretakers, vacancies, and staff access.",
    priority: "1.0",
    changefreq: "daily",
  },
  {
    title: "FAQ",
    path: "/faq",
    description:
      "FAQ: why EstateDesk beats spreadsheets and generic PMS tools, KRA eTIMS, M-Pesa rent, water billing, vacancies, caretakers, East Africa, Dubai, and pricing.",
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    title: "Best Property Management Software Kenya",
    path: "/property-management-software-kenya",
    description:
      "Kenya landing: M-Pesa collections, service-before-rent bills, offline caretaker metering, double-entry accounting, KRA eTIMS/eRITS-ready receipts, vacancy SEO, and role-based ops.",
    priority: "0.98",
    changefreq: "weekly",
  },
  {
    title: "Property Management Markets",
    path: "/property-management-markets",
    description:
      "Public index of EstateDesk property management software pages by market, workflow, and search intent.",
    priority: "0.9",
    changefreq: "weekly",
  },
  ...guidePublicIndexItems.map((item) => ({
    title: item.title,
    path: item.path,
    description: item.description,
    priority: item.priority,
    changefreq: item.changefreq,
    lastmod: item.lastmod,
  })),
  {
    title: "Pricing",
    path: "/pricing",
    description:
      "EstateDesk plans: Free, Pro at KES 3,000 per month, Plus at KES 6,500 per month, and Custom plans.",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    title: "Services",
    path: "/services",
    description:
      "Property management system features for tenants, rent, leases, water billing, caretakers, inspections, maintenance, staff access, reports, and records.",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    title: "Vacancies",
    path: "/vacancies",
    description:
      "Public vacancy discovery pages for tenants searching available houses, apartments, bedsitters, shops, offices, and rental spaces.",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    title: "Landlord Software",
    path: "/landlord-software",
    description:
      "Public page for landlords comparing online rental operations, tenants, leases, rent tracking, water billing, caretaker work, vacancies, and portfolio reporting.",
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    title: "Rent Tracking Software",
    path: "/rent-tracking-software",
    description:
      "Public page for rent tracking, balances, unpaid rent follow-up, tenant ledgers, payments, and reporting workflows.",
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    title: "Water Billing Software",
    path: "/water-billing-software",
    description:
      "Public page for rental water billing, meter readings, tenant water bills, billing history, balances, and reports.",
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    title: "Property Management Software Dubai",
    path: "/property-management-software-dubai",
    description:
      "Public page for Dubai, UAE, diaspora, and remote property teams managing tenants, rent, maintenance, inspections, vacancies, reports, and staff access.",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    title: "Contact",
    path: "/contact",
    description:
      "Contact EstateDesk for onboarding, sales, support, and custom rollout questions.",
    priority: "0.75",
    changefreq: "weekly",
  },
  {
    title: "Login",
    path: "/login",
    description:
      "Sign in to EstateDesk to manage properties, tenants, leases, rent, water billing, inspections, and team access.",
    priority: "0.7",
    changefreq: "monthly",
  },
  {
    title: "Register",
    path: "/register",
    description:
      "Create an EstateDesk account or request workspace access for property management, billing, maintenance, and team onboarding.",
    priority: "0.7",
    changefreq: "monthly",
  },
  {
    title: "Forgot Password",
    path: "/forgot-password",
    description:
      "Request a secure password reset link for your EstateDesk account.",
    priority: "0.4",
    changefreq: "monthly",
  },
  {
    title: "Reset Password",
    path: "/reset-password",
    description:
      "Set a new password for your EstateDesk account using a secure reset link.",
    priority: "0.4",
    changefreq: "monthly",
  },
  {
    title: "Verify Email",
    path: "/verify-email",
    description:
      "Confirm your EstateDesk account email address and complete account verification.",
    priority: "0.4",
    changefreq: "monthly",
  },
  {
    title: "Security",
    path: "/security",
    description:
      "Security overview for EstateDesk access controls, organization isolation, auditability, private routes, monitoring, and responsible disclosure.",
    priority: "0.65",
    changefreq: "monthly",
  },
  {
    title: "Privacy",
    path: "/privacy",
    description:
      "Privacy policy for account data, organization records, tenant records, staff records, vacancy enquiries, and operational data handling.",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    title: "Terms",
    path: "/terms",
    description:
      "EstateDesk terms for account access, subscriptions, acceptable use, customer data, and service responsibilities.",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    title: "Data Processing",
    path: "/data-processing",
    description:
      "Data processing and retention overview for customer-controlled property, tenant, lease, billing, audit, export, backup, and deletion workflows.",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    title: "Status",
    path: "/status",
    description:
      "System status page that points to EstateDesk health checks and external incident communication when configured.",
    priority: "0.5",
    changefreq: "monthly",
  },
];

export function publicSiteIndexWithUrls() {
  return publicSiteIndexItems.map((item) => ({
    ...item,
    url: absoluteUrl(item.path),
  }));
}
