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
