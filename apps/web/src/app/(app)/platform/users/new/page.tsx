import { requirePlatformRole } from "@/lib/permissions/guards";
import { NewPlatformUserWorkspace } from "./_components/new-platform-user-workspace";

export const dynamic = "force-dynamic";

export default async function NewPlatformUserPage({ searchParams }: { searchParams: Promise<{ createError?: string }> }) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const { createError } = await searchParams;
  return <NewPlatformUserWorkspace isSuperAdmin={session.platformRole === "SUPER_ADMIN"} createError={createError} />;
}
