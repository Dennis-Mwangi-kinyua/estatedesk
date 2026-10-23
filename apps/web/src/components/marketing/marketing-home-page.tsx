import { publicPrimaryAction, publicSecondaryAction } from "@/components/marketing/public-action";
import Link from "@/components/navigation/workspace-link";
import { ArrowRight, Building2, ClipboardList, Droplets, ShieldCheck, WalletCards, Wrench } from "lucide-react";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { faqJsonLd } from "@/components/marketing/seo-faq";
import { absoluteUrl } from "@/lib/seo";
import { serializeJsonForHtml } from "@/lib/security/safe-json";

const homepageFaqItems = [
  { question: "Who is EstateDesk for?", answer: "EstateDesk helps landlords, property managers and agencies organize rental records and coordinate office staff, caretakers and tenant workflows." },
  { question: "How do I get workspace access?", answer: "Submit an access request with your portfolio and contact details. Our team reviews it and contacts you to arrange your workspace and sign-in details." },
  { question: "Is there a Free plan?", answer: "Yes. The Free plan covers one property, up to five units and BnB listings combined, and two internal users. Compare the pricing page for included features and paid plans." },
  { question: "Do I need an account to browse listings?", answer: "No. You can browse public rentals, short stays and service provider profiles without signing in. Use the contact or enquiry options on the relevant listing." },
];
const features = [
  { icon: Building2, title: "Keep your portfolio organized", body: "Connect properties, units, tenants and leases so your team can find the records it needs." },
  { icon: WalletCards, title: "Know where rent stands", body: "Review charges, payment records and outstanding balances in one place." },
  { icon: Droplets, title: "Keep water billing on track", body: "Bring meter readings and water charges into your property workflow." },
  { icon: Wrench, title: "Follow repairs through", body: "Record maintenance requests, assign work and keep track of progress." },
  { icon: ClipboardList, title: "Coordinate the whole team", body: "Give office staff and caretakers a shared view of assigned work, inspections and notices." },
  { icon: ShieldCheck, title: "Control access to records", body: "Use roles and permissions to give each team member appropriate access." },
];
const steps = [
  ["Request access", "Tell us whether you manage your own properties or work for an agency, and share your portfolio needs."],
  ["Agree your setup", "The EstateDesk team reviews your request and contacts you about your workspace, plan and onboarding."],
  ["Bring your team together", "Set up your properties, tenant records and staff access, then start managing daily work."],
];
const discoveryLinks = [
  ["Find a rental", "Browse available long-term rentals and enquire with the managing team.", "/vacancies"],
  ["Find a short stay", "Explore short-stay listings and contact the host about availability.", "/stays"],
  ["Find a service provider", "Browse local providers and view their services and profiles.", "/service-providers"],
];
const button = publicPrimaryAction;
const secondaryButton = publicSecondaryAction;

export default function MarketingHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: "EstateDesk",
        url: absoluteUrl("/"),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          url: absoluteUrl("/contact"),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl("/")}#website`,
        name: "EstateDesk",
        url: absoluteUrl("/"),
        publisher: {
          "@id": `${absoluteUrl("/")}#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/vacancies")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl("/")}#sitelinks`,
        name: "EstateDesk site links",
        itemListElement: [
          { "@type": "SiteNavigationElement", position: 1, name: "Login", url: absoluteUrl("/login") },
          { "@type": "SiteNavigationElement", position: 2, name: "Vacancies", url: absoluteUrl("/vacancies") },
          { "@type": "SiteNavigationElement", position: 3, name: "Product overview", url: absoluteUrl("/services") },
          { "@type": "SiteNavigationElement", position: 4, name: "Request access", url: absoluteUrl("/register") },
          { "@type": "SiteNavigationElement", position: 5, name: "Pricing", url: absoluteUrl("/pricing") },
          { "@type": "SiteNavigationElement", position: 6, name: "Help", url: absoluteUrl("/contact") },
        ],
      },
      faqJsonLd(homepageFaqItems),
    ],
  };

  return (
    <div className="ed-theme-page ed-mobile-surface min-h-dvh bg-background text-foreground">
      <PublicAccessHeader active="home" />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(jsonLd) }} />
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-primary">For Kenyan landlords and property managers</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Your properties, rent and team. One workspace.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Keep tenant records, track rent and water bills, and follow up on repairs with EstateDesk. Give your office and field teams a clear view of daily property work.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className={button}>Request access<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                <Link href="/services" className={secondaryButton}>Explore the product</Link>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">Access requests are reviewed by our team. We will contact you to arrange your workspace and sign-in details.</p>
              <Link href="/pricing" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Compare Free, Pro, Plus and Custom plans</Link>
            </div>
            <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-label="A typical property workflow">
              <p className="text-sm font-semibold text-primary">How daily work connects</p>
              <h2 className="mt-3 text-2xl font-semibold">From a tenant record to a clear next step</h2>
              <ol className="mt-6 space-y-5">
                {[ ["Property & tenant", "Find the unit, tenant and lease details together."], ["Billing & payments", "Review charges, recorded payments and the balance."], ["Team follow-up", "Track an issue, arrange an inspection or send a notice."] ].map(([title, body], index) => (
                  <li key={title} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div></li>
                ))}
              </ol>
              <Link href="/guides" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">Read the workflow guides<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </aside>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="features-title">
          <h2 id="features-title" className="text-3xl font-semibold tracking-tight">Less time chasing records. More time managing properties.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Start with the tools your portfolio needs. Available features and limits depend on your plan.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, body }) => <article key={title} className="rounded-2xl border border-border bg-card p-6"><Icon aria-hidden="true" className="h-6 w-6 text-primary" /><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p></article>)}</div>
        </section>
        <section className="border-y border-border bg-muted/30" aria-labelledby="setup-title">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 id="setup-title" className="text-3xl font-semibold tracking-tight">A clear path to getting started</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">{steps.map(([title, body], index) => <li key={title}><p className="text-sm font-semibold text-primary">Step {index + 1}</p><h3 className="mt-2 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></li>)}</ol>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className={button}>Request access</Link><Link href="/contact#contact-sales" className={secondaryButton}>Discuss your portfolio</Link></div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="discovery-title">
          <h2 id="discovery-title" className="text-3xl font-semibold tracking-tight">Looking for a place or a local professional?</h2>
          <p className="mt-4 text-muted-foreground">You can browse public listings without signing in.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">{discoveryLinks.map(([title, body, href]) => <article key={href} className="rounded-2xl border border-border bg-card p-6"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p><Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">Browse listings<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></article>)}</div>
        </section>
        <section className="border-t border-border bg-muted/30" aria-labelledby="questions-title">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <h2 id="questions-title" className="text-3xl font-semibold tracking-tight">Before you get started</h2>
            <div className="mt-8 space-y-3">{homepageFaqItems.map((item) => <details key={item.question} className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.question}</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p></details>)}</div>
            <div className="mt-6 flex flex-wrap gap-5">{[["More questions", "/faq"], ["Security", "/security"], ["Privacy", "/privacy"]].map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">{label}</Link>)}</div>
          </div>
        </section>
      </main>
      <PublicAccessFooter />
    </div>
  );
}
