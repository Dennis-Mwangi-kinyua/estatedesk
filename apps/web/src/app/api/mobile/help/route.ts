import { z } from "zod";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { guideArticles } from "@/lib/guides";
import { canAccessGuideSlug } from "@/lib/help/in-app-guides";
import type { HelpWorkspace } from "@/lib/help/help-workspace";

const querySchema = z.object({ q: z.string().trim().max(100).default(""), page: z.coerce.number().int().min(1).max(10000).default(1) });
export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const { q, page } = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const roles: Record<string, HelpWorkspace> = { TENANT: "tenant", CARETAKER: "caretaker", LANDLORD: "landlord", ADMIN: "org", MANAGER: "org", OFFICE: "org", ACCOUNTANT: "org" };
    const workspace = roles[session.activeOrgRole ?? ""] ?? (["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) ? "platform" : null);
    const articles = workspace ? guideArticles.filter(article => canAccessGuideSlug(article.slug, workspace, session.activeOrgRole) && (!q || `${article.title} ${article.summary}`.toLowerCase().includes(q.toLowerCase()))) : [];
    const start = (page - 1) * 25;
    return mobileJson({ title: "Help & guidance", description: "Guides for your workspace", emoji: "💬", page, hasMore: articles.length > start + 25,
      records: articles.slice(start, start + 25).map(article => ({ id: article.slug, title: article.title, subtitle: article.summary, fields: article.sections.map((section, index) => ({ label: `${index + 1}. ${section.heading}`, value: section.paragraphs.join("\n\n") })) })),
      ...(workspace ? {} : { notice: "For gate access, scan or paste a visitor pass, verify the visitor's identity and confirm admission. A used, revoked or expired pass cannot admit a visitor. Contact your organization administrator for account help." }),
      related: [], searchable: true,
    });
  });
}
