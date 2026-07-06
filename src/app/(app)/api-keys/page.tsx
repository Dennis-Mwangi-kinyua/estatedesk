import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { hasPlatformRole } from "@/lib/permissions/access";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const session = await requireUserSession();

  if (
    hasPlatformRole(session.platformRole, ["SUPER_ADMIN", "PLATFORM_ADMIN"])
  ) {
    redirect("/platform/api-keys");
  }

  if (session.activeOrgRole === "ADMIN") {
    redirect("/dashboard/org/settings/api-keys");
  }

  redirect("/access-denied");
}