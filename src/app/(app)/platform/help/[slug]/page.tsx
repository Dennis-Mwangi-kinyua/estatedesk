import { notFound } from "next/navigation";
import { InAppGuideArticle } from "@/components/help/in-app-guide-article";
import { getAccessibleInAppGuideArticle } from "@/lib/help/in-app-help-access";
import { requirePlatformRole } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlatformHelpArticlePage({ params }: PageProps) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const { slug } = await params;
  const article = getAccessibleInAppGuideArticle(slug, "platform");

  if (!article) {
    notFound();
  }

  return (
    <InAppGuideArticle
      guide={article.guide}
      workspace="platform"
      relatedGuides={article.relatedGuides}
    />
  );
}