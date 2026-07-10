import { notFound } from "next/navigation";
import { InAppGuideArticle } from "@/components/help/in-app-guide-article";
import { getAccessibleInAppGuideArticle } from "@/lib/help/in-app-help-access";
import { requireTenantAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TenantHelpArticlePage({ params }: PageProps) {
  const session = await requireTenantAccess();
  const { slug } = await params;
  const article = getAccessibleInAppGuideArticle(
    slug,
    "tenant",
    session.activeOrgRole,
  );

  if (!article) {
    notFound();
  }

  return (
    <InAppGuideArticle
      guide={article.guide}
      workspace="tenant"
      relatedGuides={article.relatedGuides}
    />
  );
}