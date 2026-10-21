import type { Metadata } from "next";
import { africaLandingContent } from "@/components/marketing/international-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const revalidate = 60;
export const metadata: Metadata = publicPageMetadata({ title: "Property Management Software for Africa", description: "Evaluate EstateDesk for African property teams: tenants, rent, water billing and owner reporting. Confirm country-specific payments and rollout requirements.", path: africaLandingContent.path });
export default function Page() { return <SeoLandingPage content={africaLandingContent} />; }
