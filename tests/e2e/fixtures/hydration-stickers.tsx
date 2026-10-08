import { createElement } from "react";
import { SensitiveDataWatermark } from "@/components/security/sensitive-data-watermark";
import { VacancyInquiryAlert } from "@/features/dashboard/components/vacancy-inquiry-alert";
import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { MetricSticker } from "@/components/shared/metric-sticker";
import { SidebarSticker } from "@/components/shared/sidebar-sticker";

export function HydrationFixture() {
  return <main className="estate-workspace max-w-5xl p-4 space-y-5">
    <SensitiveDataWatermark orgLabel="Test workspace" timestamp="2026-10-08T23:59:59.000Z" />
    <WorkspaceHero kind="org" eyebrow="Organisation overview" title="Your workspace, with a little character" description="Clear labels, useful actions, and thoughtful visual accents." />
    <section className="grid gap-4 sm:grid-cols-3">
      {["Payments", "Water readings", "Vacant units"].map(label => <article key={label} className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2>{label}</h2><MetricSticker label={label} /></div><p className="mt-4 text-2xl font-semibold">12</p></article>)}
    </section>
    <nav aria-label="Fixture navigation" className="flex flex-wrap gap-4">{["airbnb", "tenants", "reports", "settings"].map(label => <a href={`#${label}`} key={label} className="flex items-center gap-2"><SidebarSticker href={`/dashboard/org/${label}`} />{label}</a>)}</nav>
    <VacancyInquiryAlert orgId="hydration-test" inquiries={[{ id: "inquiry", fullName: "Example Guest", phone: "+254712345678", email: null, message: "I would like to view this unit.", createdAt: "2026-10-08T23:30:00.000Z", unitId: "unit", unitLabel: "A1", propertyName: "Example Apartments", propertyLocation: "Nairobi" }]} />
  </main>;
}
export const renderFixture = () => createElement(HydrationFixture);
