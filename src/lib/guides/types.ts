import type { FaqItem } from "@/components/marketing/seo-faq";

export type GuideSection = {
  heading: string;
  paragraphs: string[];
};

export type GuideArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readingMinutes: number;
  publishedAt: string;
  keywords: string[];
  sections: GuideSection[];
  takeaways: string[];
  relatedGuideSlugs: string[];
  relatedLinks: { title: string; href: string; description: string }[];
  faq: readonly FaqItem[];
};

export type GuidePublicIndexItem = {
  title: string;
  path: string;
  description: string;
  priority: string;
  changefreq: "weekly" | "monthly";
  lastmod?: string;
};