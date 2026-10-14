import { globalLandingContent } from "@/components/marketing/international-landing-content";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { publicPageMetadata } from "@/lib/seo";

export const revalidate = 60;
export const metadata = publicPageMetadata({ title: "Remote Property Management for Diaspora Landlords", description: globalLandingContent.summary, path: globalLandingContent.path });
export default function Page() { return <SeoLandingPage content={globalLandingContent} />; }
