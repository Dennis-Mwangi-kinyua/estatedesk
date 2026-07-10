import { notFound } from "next/navigation";
import { GuideArticlePage } from "@/components/marketing/guide-article-page";
import {
  getPublicGuides,
  getGuideBySlug,
  getGuidePath,
  isPublicGuideArticle,
} from "@/lib/guides";
import { publicPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getPublicGuides().map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide || !isPublicGuideArticle(guide)) {
    return {};
  }

  return publicPageMetadata({
    title: guide.title,
    description: guide.summary,
    path: getGuidePath(guide.slug),
    keywords: guide.keywords,
    type: "article",
  });
}

export default async function GuideArticleRoute({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide || !isPublicGuideArticle(guide)) {
    notFound();
  }

  return <GuideArticlePage guide={guide} />;
}