import { rentTrackingLandingContent } from "@/components/marketing/seo-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Rent Tracking Software for Landlords and Property Managers",
  description:
    "EstateDesk rent tracking software helps property teams track rent charges, tenant balances, paid and unpaid tenants, payment records, verification, reminders, and reports.",
  path: rentTrackingLandingContent.path,
  keywords: [
    "rent tracking software",
    "rent tracking software Kenya",
    "rent collection tracking software",
    "unpaid rent tracking software",
    "tenant balance software",
    "rent payment tracking software",
  ],
});

export default function RentTrackingSoftwarePage() {
  return <SeoLandingPage content={rentTrackingLandingContent} />;
}
