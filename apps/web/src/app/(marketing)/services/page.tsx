import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import { ContentDepthStack } from "@/components/marketing/content-depth-sections";
import OperationsShowcase from "@/components/marketing/operations-showcase";
import { siteContentDepth } from "@/lib/content-depth/site-topics";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";
import { serializeJsonForHtml } from "@/lib/security/safe-json";

export const metadata = publicPageMetadata({
  title: "Property Management System: M-Pesa, Accounting & KRA eTIMS",
  description:
    "EstateDesk is the property management system for Kenya and beyond: tenants, M-Pesa rent, water billing, caretakers, double-entry accounting, KRA eTIMS-ready receipts, vacancies, WhatsApp ops, inspections, and staff access—built to outperform spreadsheets and generic PMS software.",
  path: "/services",
  keywords: [
    "property management system Kenya",
    "best property management software Kenya",
    "M-Pesa rent collection software",
    "KRA eTIMS property management",
    "property accounting software Kenya",
    "property management system East Africa",
    "property management system Dubai",
    "tenant management system Kenya",
    "rent tracking software Kenya",
    "caretaker workflow software",
    "property inspection software Kenya",
  ],
});

export default function ServicesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "EstateDesk property management system",
        url: absoluteUrl("/services"),
        provider: {
          "@type": "Organization",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
        areaServed: {
          "@type": "Country",
          name: "Kenya",
        },
        serviceType: "Property management software",
        description:
          "Online property management software for tenants, rent, leases, caretakers, inspections, maintenance issues, payments, water bills, staff access, reports, and records across Kenya, East Africa, Dubai, the UAE, and global rental markets.",
      },
    ],
  };

  return (
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(jsonLd) }}
      />
      <OperationsShowcase standalone showFooter={false} />
      <ServicesSeoContent />
      <ContentDepthStack {...siteContentDepth} />
      <PublicAccessFooter />
    </main>
  );
}

const services = [
  {
    title: "Property Management Software",
    href: "/property-management-software-kenya",
    body: "EstateDesk is the Kenya-first property management system for portfolios that outgrew spreadsheets: properties, units, tenants, leases, M-Pesa rent, water, accounting, KRA eTIMS-ready receipts, vacancies, caretakers, and staff roles in one product that foreign PMS tools rarely match for local ops.",
  },
  {
    title: "Tenant Management",
    href: "/landlord-software",
    body: "Tenant management keeps profiles, contacts, leases, occupancy, balances, movement history, notices, and operational notes connected to the right property and unit—searchable for renewals, move-outs, and tribunal pack exports.",
  },
  {
    title: "Rent Collection Tracking",
    href: "/rent-tracking-software",
    body: "M-Pesa STK, paybill, multi-bank rails, combined period bills, service-before-rent allocation, payment verification, and unpaid tenant follow-up—so collections match how Kenyan tenants pay.",
  },
  {
    title: "Water Billing & Offline Metering",
    href: "/water-billing-software",
    body: "Readings, tenant water charges, balances, and caretaker offline queues with photo evidence and background sync when basement connectivity returns.",
  },
  {
    title: "KRA eTIMS & Tax Readiness",
    href: "/property-management-software-kenya",
    body: "Taxpayer profiles, rental returns, eTIMS-shaped receipts on verified payments, OAuth sales submission when credentials are set, and webhook status at /api/webhooks/kra-etims.",
  },
  {
    title: "Vacancy Listings",
    href: "/vacancies",
    body: "Public vacancy discovery ranked by location and category so tenants find houses, apartments, bedsitters, shops, and offices on Google—without a separate marketing website.",
  },
  {
    title: "Accounting & Owner Reporting",
    href: "/services",
    body: "Double-entry GL, cash position, AR/AP aging, books health, budgets, and owner distributions for accountants and remote landlords who need real books—not a payment export only.",
  },
  {
    title: "Maintenance & Inspections",
    href: "/services",
    body: "Issue SLAs, caretaker assignment, inspections, printable work orders, and evidence trails so repairs do not disappear into WhatsApp threads.",
  },
];

function ServicesSeoContent() {
  return (
    <>
      <section className="border-y border-neutral-200 bg-[#f7f9fc] py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
              <Layers3 className="h-3.5 w-3.5" />
              EstateDesk services
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
              Services for organized property management
            </h1>
            <div className="mt-4 grid gap-4 text-base leading-8 text-neutral-600">
              <p>
                EstateDesk provides property management software and operational
                workflows for landlords, property managers, real estate agencies,
                caretakers, and tenants. The platform is designed to help rental
                teams manage the work that happens every day: tenant records, lease
                records, rent tracking, water billing, vacancies, maintenance
                requests, inspections, staff access, reporting, and communication.
              </p>
              <p>
                These services are especially useful for teams in Kenya, East
                Africa, Dubai, the UAE, and remote landlord markets where property
                operations often depend on many people. A landlord may need to see
                balances and vacancies. A property manager may need to follow rent
                and inspections. A caretaker may need to report issues. A tenant may
                need a clearer path for maintenance or available homes. EstateDesk
                connects these workflows so the record does not live in separate
                spreadsheets, notebooks, receipts, and message threads.
              </p>
              <p>
                The result is a more searchable, accountable, and professional
                operating system for rental property. Teams can start with basic
                property and tenant records, then grow into rent tracking, water
                billing, issue management, caretaker assignments, inspections,
                reports, public vacancies, data exports, and guided onboarding for
                larger organizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <article key={service.title} className="rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                      {service.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-neutral-600">{service.body}</p>
                    <Link
                      href={service.href}
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
                    >
                      Learn more
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ed-theme-band-inverse border-t border-white/10 py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Build a cleaner property management workflow
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-[#d1d5db]">
            EstateDesk helps teams replace scattered rental records with one
            online system for tenants, rent, water bills, vacancies, maintenance,
            inspections, staff access, and reports.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
