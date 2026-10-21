import { middleEastLandingContent } from "@/components/marketing/international-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Property Management Software for Middle East Teams",
  description: "Evaluate rental records and owner reporting with EstateDesk. For Middle East-based owners of Kenyan rentals and teams assessing local property workflows.",
  path: middleEastLandingContent.path,
  keywords: ["property management software Middle East", "Kenyan property management from UAE", "remote landlord software"],
});
export default function Page() {
  return <SeoLandingPage content={middleEastLandingContent} />;
}
