import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

const pages = [
  {
    title: "Home",
    url: absoluteUrl("/"),
    description:
      "EstateDesk overview for property management software across Kenya, East Africa, Dubai, UAE, and global rental markets.",
  },
  {
    title: "Services",
    url: absoluteUrl("/services"),
    description:
      "Property management system features for tenants, rent, leases, water billing, caretakers, inspections, maintenance, staff access, reports, and records.",
  },
  {
    title: "Pricing",
    url: absoluteUrl("/pricing"),
    description:
      "EstateDesk plans: Free, Pro at KES 3,000 per month, Plus at KES 6,500 per month, and Custom plans.",
  },
  {
    title: "FAQ",
    url: absoluteUrl("/faq"),
    description:
      "Detailed FAQ for landlords, property managers, diaspora landlords, East Africa, Dubai, UAE, remote rental management, vacant units, rent tracking, water billing, and caretaker workflows.",
  },
  {
    title: "Property Management Software Kenya",
    url: absoluteUrl("/property-management-software-kenya"),
    description:
      "Search landing page for Kenyan landlords, property managers, agencies, caretakers, rent tracking, water billing, vacancies, maintenance, inspections, reports, and staff access.",
  },
  {
    title: "Landlord Software",
    url: absoluteUrl("/landlord-software"),
    description:
      "Public page for landlords comparing online rental operations, tenants, leases, rent tracking, water billing, caretaker work, vacancies, and portfolio reporting.",
  },
  {
    title: "Rent Tracking Software",
    url: absoluteUrl("/rent-tracking-software"),
    description:
      "Public page for rent tracking, balances, unpaid rent follow-up, tenant ledgers, payments, and reporting workflows.",
  },
  {
    title: "Water Billing Software",
    url: absoluteUrl("/water-billing-software"),
    description:
      "Public page for rental water billing, meter readings, tenant water bills, billing history, balances, and reports.",
  },
  {
    title: "Property Management Software Dubai",
    url: absoluteUrl("/property-management-software-dubai"),
    description:
      "Public page for Dubai, UAE, diaspora, and remote property teams managing tenants, rent, maintenance, inspections, vacancies, reports, and staff access.",
  },
  {
    title: "Vacancies",
    url: absoluteUrl("/vacancies"),
    description:
      "Public vacancy discovery pages for tenants searching available houses, apartments, bedsitters, shops, offices, and rental spaces.",
  },
  {
    title: "Contact",
    url: absoluteUrl("/contact"),
    description:
      "Contact EstateDesk for onboarding, sales, support, and custom rollout questions.",
  },
  {
    title: "Security",
    url: absoluteUrl("/security"),
    description:
      "Security overview for EstateDesk access controls, organization isolation, auditability, private routes, monitoring, and responsible disclosure.",
  },
  {
    title: "Privacy",
    url: absoluteUrl("/privacy"),
    description:
      "Privacy policy for account data, organization records, tenant records, staff records, vacancy enquiries, and operational data handling.",
  },
  {
    title: "Data Processing",
    url: absoluteUrl("/data-processing"),
    description:
      "Data processing and retention overview for customer-controlled property, tenant, lease, billing, audit, export, backup, and deletion workflows.",
  },
  {
    title: "Status",
    url: absoluteUrl("/status"),
    description:
      "System status page that points to EstateDesk health checks and external incident communication when configured.",
  },
];

export async function GET() {
  const content = [
    `# ${SITE_NAME}`,
    "",
    SITE_DESCRIPTION,
    "",
    "## Primary Public Pages",
    ...pages.flatMap((page) => [
      "",
      `- ${page.title}: ${page.url}`,
      `  ${page.description}`,
    ]),
    "",
    "## Core Topics",
    "- Property management software",
    "- Landlord software",
    "- Tenant management software",
    "- Rent tracking and unpaid rent follow-up",
    "- Water billing workflows",
    "- Caretaker management",
    "- Maintenance issue tracking",
    "- Property inspections",
    "- Public vacancy discovery",
    "- Remote and diaspora landlord management",
    "- East Africa property management",
    "- Dubai and UAE property management",
    "",
    "## Indexing Notes",
    "- Public marketing, pricing, FAQ, contact, and vacancy pages are intended for discovery.",
    "- Private dashboards, platform administration, API, print, password reset, and invite routes are not public content.",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
