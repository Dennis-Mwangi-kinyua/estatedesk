import { TrustPage } from "@/components/marketing/trust-page";
import { ESTATEDESK_DPA_DRAFT } from "@/lib/service-agreements/contract";
import { publicPageMetadata } from "@/lib/seo";
export const metadata = publicPageMetadata({title: "EstateDesk Data Processing Agreement", description: "Data processing agreement template for Afrisilicon Technology Limited, trading as EstateDesk, and its customer organizations.", path: "/data-processing-agreement"});
export default function Page() {
  const paragraphs = ESTATEDESK_DPA_DRAFT.split("\n\n");
  return <TrustPage eyebrow="Legal template" title="EstateDesk Data Processing Agreement" updatedAt="October 15, 2026" description="Unsigned template for Afrisilicon Technology Limited, trading as EstateDesk. Complete organization-specific schedules and obtain appropriate legal review before signing. Organization agreements are prepared and signed in the authenticated workspaces." sections={paragraphs.slice(1).map((paragraph, index) => {const [title, ...body] = paragraph.split("\n");return {title: title || `Clause ${index + 1}`,body: [body.join("\n")]};})} />;
}
