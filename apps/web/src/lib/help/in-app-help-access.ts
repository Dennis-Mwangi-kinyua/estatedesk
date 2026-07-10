import type { OrgRole } from "@prisma/client";
import { getGuideBySlug, getRelatedGuides } from "@/lib/guides";
import type { HelpWorkspace } from "@/lib/help/help-workspace";
import { canAccessGuideSlug } from "@/lib/help/in-app-guides";

export function getAccessibleInAppGuideArticle(
  slug: string,
  workspace: HelpWorkspace,
  orgRole?: OrgRole | null,
) {
  if (!canAccessGuideSlug(slug, workspace, orgRole)) {
    return null;
  }

  const guide = getGuideBySlug(slug);
  if (!guide) return null;

  const relatedGuides = getRelatedGuides([...guide.relatedGuideSlugs]).filter(
    (related) => canAccessGuideSlug(related.slug, workspace, orgRole),
  );

  return { guide, relatedGuides };
}