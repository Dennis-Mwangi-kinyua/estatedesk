import { HelpCircle } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
};

export const marketingFaqItems: readonly FaqItem[] = [
  {
    question: "What is EstateDesk?",
    answer:
      "EstateDesk is Kenya-built property management software for landlords, property managers, agencies, caretakers, accountants, and tenants. It unifies tenants, leases, M-Pesa rent collection, water billing, double-entry accounting, KRA eTIMS-ready receipts, offline caretaker metering, WhatsApp ops, public vacancies, inspections, and staff access in one secure workspace.",
  },
  {
    question: "Why is EstateDesk better than other property management software?",
    answer:
      "Most global PMS tools ignore Kenyan realities. EstateDesk supports M-Pesa and multi-bank collections, service-before-rent allocation on partial payments, offline caretaker metering, vacancy SEO pages, double-entry accounting with AR/AP aging, WhatsApp billing intents, and KRA eTIMS/eRITS-ready receipts—features spreadsheets and foreign products rarely combine.",
  },
  {
    question: "Who should use EstateDesk?",
    answer:
      "EstateDesk is built for landlords, real estate offices, property management companies, caretakers, accountants, and operations teams that need a searchable system for rental records, tenant history, payments, tax-ready receipts, issues, and property workflows.",
  },
  {
    question: "Is EstateDesk property management software for Kenya?",
    answer:
      "Yes. EstateDesk is built around Kenyan rental operations: M-Pesa and bank payments, water bills, caretaker field work, KRA taxpayer profiles, eTIMS-ready receipts, tenant communication, public vacancy discovery, and organization-level staff access.",
  },
  {
    question: "Does EstateDesk integrate with KRA eTIMS?",
    answer:
      "Yes. Verified payments produce eTIMS-shaped receipt data (seller PIN, control unit, item lines). When KRA_ETIMS credentials and CU serial are configured, EstateDesk can submit sales payloads and accept KRA webhook status at /api/webhooks/kra-etims.",
  },
  {
    question: "Can EstateDesk help landlords manage multiple properties?",
    answer:
      "Yes. Landlords and property managers can organize properties, buildings, units, tenants, leases, payments, inspections, maintenance issues, staff members, and reports in one online workspace instead of relying on disconnected spreadsheets or paper files.",
  },
  {
    question: "Does EstateDesk replace spreadsheets for rental management?",
    answer:
      "EstateDesk gives property teams a structured alternative to spreadsheets by keeping tenant records, lease details, balances, unit status, water bills, maintenance issues, inspections, and staff actions searchable and easier to audit.",
  },
  {
    question: "Does EstateDesk support rent and water billing?",
    answer:
      "Yes. EstateDesk supports rent charges, tenant balances, manual payment records, payment verification, water billing workflows, and reports for paid and unpaid tenants depending on the selected plan.",
  },
  {
    question: "Can EstateDesk track tenants, leases, and move-out history?",
    answer:
      "Yes. EstateDesk keeps tenant profiles, lease records, occupancy details, move-out notices, inspections, tenant history, and operational notes together so managers can review a tenant record before onboarding, transfer, or follow-up.",
  },
  {
    question: "Does EstateDesk support maintenance and issue tracking?",
    answer:
      "Yes. EstateDesk includes issue ticket workflows so tenants, caretakers, and office teams can track maintenance requests, status changes, assignments, history, and follow-up from one system.",
  },
  {
    question: "Can EstateDesk help with property inspections?",
    answer:
      "Yes. EstateDesk supports inspection workflows for property checks, move-out reviews, issue documentation, caretaker follow-up, and printable inspection reports depending on the plan and team setup.",
  },
  {
    question: "Can tenants search for vacant houses?",
    answer:
      "Yes. Public vacancy pages let tenants search available homes by location, rent, property details, and unit information, then contact the managing landlord or office directly.",
  },
  {
    question: "Can landlords publish vacant units online?",
    answer:
      "Yes. EstateDesk can expose vacant units through public vacancy pages so prospective tenants can discover available homes, compare rent and unit details, and contact the managing office directly.",
  },
  {
    question: "How much does EstateDesk cost?",
    answer:
      "EstateDesk has a Free plan, a Pro plan at KES 3,000 per month, a Plus plan at KES 6,500 per month, and Custom pricing for larger organizations that need tailored rollout support.",
  },
  {
    question: "Can a team manage staff and caretaker access?",
    answer:
      "Yes. EstateDesk includes role-aware access for organization admins, managers, accountants, caretakers, and staff so each person can work with the records and workflows assigned to them.",
  },
  {
    question: "Is EstateDesk mobile friendly?",
    answer:
      "Yes. EstateDesk is designed as a web-based system that works across phones, tablets, laptops, and desktop screens, giving landlords, caretakers, tenants, and office teams access from common modern browsers.",
  },
  {
    question: "Does EstateDesk support reports for property managers?",
    answer:
      "Yes. EstateDesk includes operational reports for areas such as occupancy, payments, tenant balances, paid and unpaid tenants, issues, inspections, and organization activity depending on the selected plan.",
  },
  {
    question: "Is EstateDesk suitable for property management companies?",
    answer:
      "Yes. EstateDesk is suitable for property management companies that need organized tenant records, property portfolios, billing workflows, caretaker coordination, reports, staff permissions, and searchable audit-friendly records.",
  },
];

export const pricingFaqItems: readonly FaqItem[] = [
  {
    question: "Is there a free EstateDesk plan?",
    answer:
      "Yes. The Free plan is available for small landlords who want to start with one property, up to ten units, tenant profiles, occupancy tracking, basic lease records, and a basic dashboard.",
  },
  {
    question: "What is included in the Pro plan?",
    answer:
      "The Pro plan is KES 3,000 per month and adds rent tracking, balances, water billing workflows, payment verification, tenant payment ratings, notifications, reminders, and issue ticket handling.",
  },
  {
    question: "Who is the Pro plan best for?",
    answer:
      "The Pro plan is best for active landlords and property teams that have moved beyond basic records and need rent follow-up, water billing, payment verification, issue handling, tenant ratings, and notifications.",
  },
  {
    question: "What is included in the Plus plan?",
    answer:
      "The Plus plan is KES 6,500 per month and is designed for growing portfolios that need caretaker assignments, move-out notices, inspections, tenant history, operational reports, audit visibility, data export requests, and priority support.",
  },
  {
    question: "Who is the Plus plan best for?",
    answer:
      "The Plus plan is best for growing property portfolios and management offices that need coordinated staff workflows, caretaker assignments, move-out inspections, deeper reporting, export requests, and stronger operational oversight.",
  },
  {
    question: "When should I choose Custom pricing?",
    answer:
      "Choose Custom pricing if your organization needs unlimited scale, tailored billing terms, bulk migration, implementation support, governance planning, custom reporting guidance, or dedicated support reviews.",
  },
  {
    question: "Can I start free and upgrade later?",
    answer:
      "Yes. You can start with the Free plan and move to Pro, Plus, or Custom when your property portfolio, billing workflow, staff needs, reporting requirements, or support expectations grow.",
  },
  {
    question: "Are EstateDesk prices monthly?",
    answer:
      "Yes. Published Pro and Plus pricing is monthly: Pro is KES 3,000 per month and Plus is KES 6,500 per month. Custom plans use tailored billing terms agreed with the organization.",
  },
];

export const regionalFaqItems: readonly FaqItem[] = [
  {
    question: "Can EstateDesk be used outside Kenya?",
    answer:
      "Yes. EstateDesk is a web-based property management system, so landlords and property teams can use it for rental operations beyond Kenya. The product is especially relevant to markets that need tenant records, rent tracking, unit occupancy, staff access, maintenance workflows, inspections, and searchable property records.",
  },
  {
    question: "Is EstateDesk suitable for East African property managers?",
    answer:
      "Yes. EstateDesk is suitable for property managers in East African markets such as Kenya, Uganda, Tanzania, Rwanda, and nearby regions where rental teams need organized tenant records, rent follow-up, water billing, caretaker coordination, vacancy publishing, and operational reporting.",
  },
  {
    question: "Can EstateDesk support landlords in Dubai or the UAE?",
    answer:
      "EstateDesk can support landlords and property teams in Dubai or the UAE who need a structured online workspace for properties, units, tenants, leases, payments, maintenance issues, inspections, staff permissions, and reports. Custom rollout can help align terminology and workflows for larger teams.",
  },
  {
    question: "Is EstateDesk useful for diaspora landlords managing property remotely?",
    answer:
      "Yes. EstateDesk is useful for diaspora landlords and remote property owners who need visibility into tenants, occupancy, rent records, balances, water bills, caretakers, inspections, maintenance issues, and reports without being physically present at the property every day.",
  },
  {
    question: "Can EstateDesk handle multiple branches or property offices?",
    answer:
      "Yes. EstateDesk is designed around organization workspaces, role-aware access, properties, buildings, units, tenants, staff, and operational records. This makes it suitable for real estate offices, property management companies, and teams working across multiple locations.",
  },
  {
    question: "Does EstateDesk work for small landlords and large portfolios?",
    answer:
      "Yes. Small landlords can start with basic property and tenant records, while growing teams can use paid plans for billing workflows, caretaker assignments, inspections, reports, exports, staff controls, and custom rollout support.",
  },
  {
    question: "What makes EstateDesk discoverable for tenants looking for homes?",
    answer:
      "EstateDesk includes public vacancy pages that can be indexed by search engines. This helps available units appear through location and category pages, making it easier for tenants to find vacant houses, apartments, bedsitters, shops, offices, and other rental spaces online.",
  },
  {
    question: "Can EstateDesk support international property management workflows?",
    answer:
      "EstateDesk can support many international rental workflows because the core system focuses on universal property operations: properties, units, tenants, leases, rent records, maintenance, inspections, team access, notifications, and reporting. Custom plans can adapt rollout details for larger organizations.",
  },
];

export const searchIntentFaqItems: readonly FaqItem[] = [
  {
    question: "What is the best property management software for landlords in Kenya?",
    answer:
      "The best property management software for a Kenyan landlord should help with tenant records, unit occupancy, rent tracking, water billing, caretaker coordination, maintenance issues, inspections, reports, and staff access. EstateDesk is built around those rental workflows so landlords and property managers can keep their operations organized online.",
  },
  {
    question: "What software can landlords use instead of Excel for rent records?",
    answer:
      "Landlords can use EstateDesk instead of spreadsheets to keep tenant profiles, lease records, rent balances, water bills, payment verification, vacant units, maintenance issues, inspections, and reports in a structured online system.",
  },
  {
    question: "How can property managers track unpaid rent?",
    answer:
      "Property managers can use EstateDesk to track rent charges, tenant balances, paid and unpaid tenants, manual payment records, verification status, reminders, and reports so follow-up is easier and less dependent on manual spreadsheets.",
  },
  {
    question: "How can I manage rental property remotely from Dubai?",
    answer:
      "A remote or diaspora landlord can use EstateDesk to monitor properties, tenants, leases, rent records, water bills, vacant units, caretaker activity, maintenance issues, inspections, and reports through an online workspace while coordinating with a local property team.",
  },
  {
    question: "What software helps caretakers report maintenance issues?",
    answer:
      "EstateDesk supports issue tracking workflows so caretakers and property teams can record maintenance requests, update statuses, document follow-up, and keep the office informed about repairs and tenant issues.",
  },
  {
    question: "How can landlords list vacant houses online?",
    answer:
      "EstateDesk can expose vacant units through public vacancy pages, including location and category pages for homes, apartments, bedsitters, shops, offices, and other rental spaces. This helps prospective tenants discover available units online and contact the managing office.",
  },
  {
    question: "Can EstateDesk manage apartments, bedsitters, shops, offices, and mixed-use property?",
    answer:
      "Yes. EstateDesk is designed for different rental unit types, including apartments, bedsitters, single rooms, shops, offices, stalls, warehouses, godowns, and mixed-use portfolios where managers need clear occupancy, billing, and tenant records.",
  },
  {
    question: "What should real estate agencies look for in property management software?",
    answer:
      "Real estate agencies should look for software that supports multiple properties, tenant and lease records, rent tracking, water billing, staff permissions, caretaker workflows, issue tickets, inspections, reports, public vacancies, and secure access controls. EstateDesk combines these workflows in one web-based system.",
  },
  {
    question: "Can EstateDesk help reduce rental management paperwork?",
    answer:
      "Yes. EstateDesk helps reduce paperwork by digitizing tenant records, property records, leases, rent balances, water bills, maintenance issues, inspections, notifications, reports, and staff activity so teams can search and review records faster.",
  },
  {
    question: "Is EstateDesk cloud property management software?",
    answer:
      "Yes. EstateDesk is web-based property management software, which means teams can access the system through modern browsers instead of installing a local desktop application on one office computer.",
  },
];

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function SeoFaq({
  eyebrow = "FAQ",
  title = "Frequently asked questions",
  description,
  items,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: readonly FaqItem[];
}) {
  return (
    <section className="border-t border-neutral-200 bg-white py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
            <HelpCircle className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-base leading-7 text-neutral-600">{description}</p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-5"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-neutral-950">
                <span className="inline-flex w-full items-center justify-between gap-4">
                  <span>{item.question}</span>
                  <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-500 group-open:hidden">
                    Open
                  </span>
                  <span className="hidden shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-500 group-open:inline-flex">
                    Close
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
