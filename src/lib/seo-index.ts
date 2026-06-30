export type SeoIndexItem = {
  title: string;
  href: string;
  description: string;
  keywords: string[];
};

export const marketCoverageItems = [
  {
    title: "Property management software in Kenya",
    href: "/property-management-software-kenya",
    description:
      "For landlords, agents, caretakers, and property managers handling rent, tenants, water billing, maintenance, inspections, vacancies, and reports in Kenya.",
    keywords: [
      "property management software Kenya",
      "landlord software Kenya",
      "rent management system Kenya",
      "property manager software Nairobi",
    ],
  },
  {
    title: "Property management software for Dubai and UAE",
    href: "/property-management-software-dubai",
    description:
      "For Dubai, UAE, diaspora, and remote property teams that need structured rental records, tenant follow-up, maintenance, vacancies, and portfolio oversight.",
    keywords: [
      "property management software Dubai",
      "property management software UAE",
      "landlord software Dubai",
      "diaspora landlord property management software",
    ],
  },
  {
    title: "Landlord software",
    href: "/landlord-software",
    description:
      "For individual landlords and growing portfolios that need tenant records, rent balances, lease visibility, caretaker updates, and online reporting.",
    keywords: [
      "landlord software",
      "landlord software Kenya",
      "rental portfolio management software",
      "property software for small landlords",
    ],
  },
  {
    title: "Rent tracking software",
    href: "/rent-tracking-software",
    description:
      "For teams that need rent charges, payment status, unpaid balance follow-up, tenant ledgers, receipts, and reconciliation-ready records.",
    keywords: [
      "rent tracking software",
      "rent management system",
      "tenant ledger software",
      "unpaid rent tracking",
    ],
  },
  {
    title: "Water billing software",
    href: "/water-billing-software",
    description:
      "For rental teams that bill water from readings, track tenant water balances, connect bills to payments, and keep period-by-period history.",
    keywords: [
      "water billing software Kenya",
      "rental water billing",
      "tenant water bills",
      "meter reading billing software",
    ],
  },
  {
    title: "Vacant houses and rental listings",
    href: "/vacancies",
    description:
      "For tenants searching public vacancies and managers publishing available units with location, rent, viewing, and enquiry details.",
    keywords: [
      "vacant houses Kenya",
      "houses for rent Kenya",
      "apartments for rent Kenya",
      "rental vacancies",
    ],
  },
  {
    title: "EstateDesk services",
    href: "/services",
    description:
      "A feature overview for tenant management, leases, rent, water billing, inspections, maintenance, staff permissions, and reporting.",
    keywords: [
      "property management services software",
      "tenant management software",
      "lease management software",
      "caretaker management software",
    ],
  },
  {
    title: "EstateDesk pricing",
    href: "/pricing",
    description:
      "Plan comparison for Free, Pro, Plus, and Custom EstateDesk workspaces, with portfolio limits and rollout options.",
    keywords: [
      "EstateDesk pricing",
      "property management software pricing Kenya",
      "landlord software pricing",
      "rent management system pricing",
    ],
  },
] as const satisfies SeoIndexItem[];

export const marketCoverageKeywords = Array.from(
  new Set(marketCoverageItems.flatMap((item) => item.keywords)),
);
