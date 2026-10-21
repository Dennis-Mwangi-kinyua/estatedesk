import type { Metadata } from "next";
import { globalLandingContent } from "@/components/marketing/international-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const revalidate = 60;
export const metadata: Metadata = publicPageMetadata({ title: "Remote Property Management for Diaspora Landlords", description: "Oversee Kenyan rentals from abroad with EstateDesk. Connect local managers and diaspora owners through tenancy records, rent reporting and maintenance updates.", path: globalLandingContent.path });
export default function Page() { return <SeoLandingPage content={globalLandingContent} />; }
