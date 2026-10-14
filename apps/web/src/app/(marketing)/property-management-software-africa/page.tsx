import { africaLandingContent } from "@/components/marketing/international-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const revalidate = 60;
export const metadata = publicPageMetadata({ title: "Property Management Software for Africa", description: africaLandingContent.summary, path: africaLandingContent.path });
export default function Page() { return <SeoLandingPage content={africaLandingContent} />; }
