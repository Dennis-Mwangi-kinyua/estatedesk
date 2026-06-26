import { TrustPage } from "@/components/marketing/trust-page";
import { termsDescription, termsSections, termsTitle, termsUpdatedAt } from "@/lib/terms";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: termsTitle,
  description:
    "Professional EstateDesk terms of service covering accounts, customer data, privacy, data processing, deletion, payments, subscriptions, exports, security, and acceptable use.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <TrustPage
      eyebrow="Terms"
      title={termsTitle}
      description={termsDescription}
      updatedAt={termsUpdatedAt}
      sections={termsSections}
      downloadHref="/api/legal/terms.pdf"
    />
  );
}
