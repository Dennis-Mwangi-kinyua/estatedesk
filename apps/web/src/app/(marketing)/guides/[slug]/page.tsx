import type { Metadata } from "next";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide || !isPublicGuideArticle(guide)) {
    return {};
  }

  const metadata = publicPageMetadata({
    title: guide.title,
    description: guide.summary,
    path: getGuidePath(guide.slug),
    keywords: guide.keywords,
    type: "article",
  });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.publishedAt,
      authors: ["EstateDesk"],
      section: guide.category,
      tags: guide.keywords,
    },
  };
}

export default async function GuideArticleRoute({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide || !isPublicGuideArticle(guide)) {
    notFound();
  }

  return <GuideArticlePage guide={guide} />;
}