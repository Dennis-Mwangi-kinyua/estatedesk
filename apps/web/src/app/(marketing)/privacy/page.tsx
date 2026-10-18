import type { Metadata } from "next";
import { TrustPage } from "@/components/marketing/trust-page";
import { trustContentDepth } from "@/lib/content-depth/marketing-depth";
import { privacySections } from "@/lib/legal/privacy";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy Policy",
  description:
    "EstateDesk privacy policy for property management software users, organizations, tenants, staff, and public vacancy visitors.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <TrustPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="How EstateDesk approaches personal data, property records, tenant information, and public vacancy enquiries."
      updatedAt="June 2, 2026"
      sections={privacySections}
      contentDepth={trustContentDepth}
    />
  );
}
