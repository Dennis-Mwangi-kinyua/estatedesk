import type { Metadata } from "next";
import { dubaiLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Property Management Software for Dubai and UAE",
  description:
    "Oversee Kenyan rentals from Dubai with EstateDesk, or evaluate tenant records, rent tracking and reporting for a UAE portfolio. Confirm local integrations.",
  path: dubaiLandingContent.path,
  keywords: [
    "property management software Dubai",
    "property management software UAE",
    "landlord software Dubai",
    "real estate management software Dubai",
    "remote landlord software Dubai",
    "diaspora landlord property management software",
  ],
});

export default function PropertyManagementSoftwareDubaiPage() {
  return <SeoLandingPage content={dubaiLandingContent} />;
}
