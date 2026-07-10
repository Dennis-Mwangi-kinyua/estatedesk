import { notFound } from "next/navigation";
import { GuideArticlePage } from "@/components/marketing/guide-article-page";
import {
  getAllGuides,
  getGuideBySlug,
  getGuidePath,
} from "@/lib/guides";
import { publicPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllGuides().map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
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

  if (!guide) {
    notFound();
  }

  return <GuideArticlePage guide={guide} />;
}