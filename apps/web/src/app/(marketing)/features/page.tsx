import Link from "next/link";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { productFeatures } from "@/lib/product-features";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";
import { serializeJsonForHtml } from "@/lib/security/safe-json";

export const metadata = publicPageMetadata({
  title: "Property Management Features: Rent, CRM & Mobile",
  description: "Explore EstateDesk’s rent statements, M-Pesa payments, accounting, water billing, CRM, recruitment, CSV imports, security and cross-platform tools.",
  path: "/features",
});

export default function FeaturesPage() {
  const data = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: "EstateDesk product features", url: absoluteUrl("/features"),
    itemListElement: productFeatures.map((feature, index) => ({
      "@type": "ListItem", position: index + 1,
      name: feature.title, description: feature.description,
      url: absoluteUrl(`/features#${feature.id}`),
    })),
  };
  return <div className="ed-theme-page ed-mobile-surface min-h-dvh bg-background text-foreground">
    <PublicAccessHeader active="services" />
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(data) }} />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Property management features, in one workspace</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">From tenant setup to rent follow-up, fieldwork and owner reporting, explore what EstateDesk includes. Availability depends on your plan, role and configured integrations.</p>
      <nav aria-label="Feature topics" className="my-8 flex flex-wrap gap-2">
        {productFeatures.map(feature => <a key={feature.id} href={`#${feature.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 py-2 text-sm underline underline-offset-4">{feature.title}</a>)}
      </nav>
      <div className="grid gap-5 md:grid-cols-2">
        {productFeatures.map(feature => <article key={feature.id} id={feature.id} className="scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{feature.title}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{feature.description}</p>
          <Link href={feature.href} className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Explore {feature.title.toLowerCase()}</Link>
        </article>)}
      </div>
      <section id="device-support" className="mt-10 scroll-mt-24 rounded-xl border border-border p-5 sm:p-8">
        <h2 className="text-2xl font-semibold">Choose the experience for your phone</h2>
        <p className="mt-4 leading-7">The full web workspace targets Chrome, Edge and Firefox 111 or later, and Safari 16.4 or later. An older phone with a supported browser can use the web version. Camera, notifications and installation depend on your browser and device.</p>
        <p className="mt-3 leading-7">For older browsers or limited connectivity, our basic overview uses plain HTML and CSS without JavaScript, images or web fonts. It explains the product and links to the full site. Secure dashboard operations still require a supported browser and a connection.</p>
        <a href="/basic.html" className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Open the lightweight overview</a>
      </section>
      <Link href="/pricing" className="mt-8 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Compare plans and feature access</Link>
    </main>
    <PublicAccessFooter />
  </div>;
}
