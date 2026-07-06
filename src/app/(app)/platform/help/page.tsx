import { InAppGuideHub } from "@/components/help/in-app-guide-hub";
import { requirePlatformRole } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

export default async function PlatformHelpPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  return <InAppGuideHub workspace="platform" />;
}