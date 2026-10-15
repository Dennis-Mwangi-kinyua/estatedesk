import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import { PLATFORM_MODE_COOKIE_NAME, parsePlatformModeCookie } from "../platform/_lib/nav";

export default async function DashboardPage() {
  const session = await getUserSession();
  if (!session) redirect("/login");
  // Only accounts without a workspace need the provider fallback lookup.
  const isPlatform = session.platformRole === "SUPER_ADMIN" || session.platformRole === "PLATFORM_ADMIN";
  const hasServiceProvider = !isPlatform && !session.activeOrgRole && Boolean(
    await prisma.serviceProvider.findUnique({ where: { userId: session.userId }, select: { id: true } }),
  );
  redirect(getRedirectAfterLogin({
    platformRole: session.platformRole,
    activeOrgRole: session.activeOrgRole,
    activeOrgId: session.activeOrgId,
    hasTenantProfile: false,
    hasServiceProvider,
    preferredPlatformMode: isPlatform
      ? parsePlatformModeCookie((await cookies()).get(PLATFORM_MODE_COOKIE_NAME)?.value)
      : null,
  }));
}
