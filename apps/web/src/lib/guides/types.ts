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
  /**
   * When true, guide is platform-operator only and must never appear on
   * public /guides, sitemaps, or llms.txt.
   */
  privatePlatform?: boolean;
  /**
   * When true, guide is authenticated workspace help only (org / tenant /
   * caretaker / landlord). Never public, never sitemapped, never in llms.txt.
   * Content must stay role-appropriate and must not leak secrets, internal
   * architecture, env vars, or other personas' sensitive workflows.
   */
  privateInApp?: boolean;
};

/** True when a guide may appear on the public marketing site. */
export function isPublicGuideArticle(guide: {
  privatePlatform?: boolean;
  privateInApp?: boolean;
}) {
  return !guide.privatePlatform && !guide.privateInApp;
}

export type GuidePublicIndexItem = {
  title: string;
  path: string;
  description: string;
  priority: string;
  changefreq: "weekly" | "monthly";
  lastmod?: string;
};