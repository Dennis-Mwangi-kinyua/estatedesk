import { notFound, redirect } from "next/navigation";
import { InAppGuideArticle } from "@/components/help/in-app-guide-article";
import { requireUserSession } from "@/lib/auth/session";
import { getAccessibleInAppGuideArticle } from "@/lib/help/in-app-help-access";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LandlordHelpArticlePage({ params }: PageProps) {
  const session = await requireUserSession();

  if (session.activeOrgRole !== "LANDLORD") {
    redirect("/access-denied");
  }

  const { slug } = await params;
  const article = getAccessibleInAppGuideArticle(
    slug,
    "landlord",
    session.activeOrgRole,
  );

  if (!article) {
    notFound();
  }

  return (
    <InAppGuideArticle
      guide={article.guide}
      workspace="landlord"
      relatedGuides={article.relatedGuides}
    />
  );
}