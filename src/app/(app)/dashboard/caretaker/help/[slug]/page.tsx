import { notFound } from "next/navigation";
import { InAppGuideArticle } from "@/components/help/in-app-guide-article";
import { getAccessibleInAppGuideArticle } from "@/lib/help/in-app-help-access";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { HelpWorkspace } from "../_components/help-workspace";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CaretakerHelpArticlePage({ params }: PageProps) {
  const session = await requireCaretakerAccess();
  const { slug } = await params;
  const article = getAccessibleInAppGuideArticle(
    slug,
    "caretaker",
    session.activeOrgRole,
  );

  if (!article) {
    notFound();
  }

  return (
    <HelpWorkspace
      title={article.guide.title}
      description={article.guide.summary}
      note="Caretaker workspace guide article"
    >
      <InAppGuideArticle
        guide={article.guide}
        workspace="caretaker"
        relatedGuides={article.relatedGuides}
      />
    </HelpWorkspace>
  );
}