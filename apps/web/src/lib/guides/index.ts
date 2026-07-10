import { guideArticles } from "@/lib/guides/articles";
import type { GuideArticle, GuidePublicIndexItem } from "@/lib/guides/types";

export { guideArticles } from "@/lib/guides/articles";
export type { GuideArticle, GuideSection, GuidePublicIndexItem } from "@/lib/guides/types";

const GUIDE_HUB_PATH = "/guides";

export function getGuideHubPath() {
  return GUIDE_HUB_PATH;
}

export function getGuidePath(slug: string) {
  return `${GUIDE_HUB_PATH}/${slug}`;
}

export function getAllGuides() {
  return guideArticles;
}

export function getGuideBySlug(slug: string) {
  return guideArticles.find((guide) => guide.slug === slug);
}

export function getRelatedGuides(slugs: string[]): GuideArticle[] {
  return slugs.flatMap((slug) => {
    const guide = getGuideBySlug(slug);
    return guide ? [guide] : [];
  });
}

export const guideHubPublicIndexItem: GuidePublicIndexItem = {
  title: "Property Management Guides",
  path: GUIDE_HUB_PATH,
  description:
    "Long-form EstateDesk guides on rent tracking, water billing, caretaker workflows, tenant issues, vacancy marketing, diaspora landlords, move-outs, and rental operations in Kenya and beyond.",
  priority: "0.88",
  changefreq: "weekly",
};

export const guidePublicIndexItems: GuidePublicIndexItem[] = [
  guideHubPublicIndexItem,
  ...guideArticles.map((guide) => ({
    title: guide.title,
    path: getGuidePath(guide.slug),
    description: guide.summary,
    priority: "0.82",
    changefreq: "monthly" as const,
    lastmod: guide.publishedAt,
  })),
];

export const guideCategories = Array.from(
  new Set(guideArticles.map((guide) => guide.category)),
).sort();