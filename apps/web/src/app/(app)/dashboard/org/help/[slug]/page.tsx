import { notFound } from "next/navigation";
import { InAppGuideArticle } from "@/components/help/in-app-guide-article";
import { getAccessibleInAppGuideArticle } from "@/lib/help/in-app-help-access";
import { requireManagementAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function OrgHelpArticlePage({ params }: PageProps) {
  const session = await requireManagementAccess();
  const { slug } = await params;
  const article = getAccessibleInAppGuideArticle(
    slug,
    "org",
    session.activeOrgRole,
  );

  if (!article) {
    notFound();
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <InAppGuideArticle
        guide={article.guide}
        workspace="org"
        relatedGuides={article.relatedGuides}
      />
    </div>
  );
}