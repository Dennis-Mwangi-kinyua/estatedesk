import { requirePlatformRole } from "@/lib/permissions/guards";
import { privatePageMetadata } from "@/lib/seo";
import { AdminsWorkspace } from "./_components/admins-workspace";
import { getPlatformAdmins } from "./_lib/queries";

export const dynamic = "force-dynamic";
export const metadata = privatePageMetadata;

export default async function PlatformAdminsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  let admins: Awaited<ReturnType<typeof getPlatformAdmins>> | null = null;
  let loadFailed = false;

  try {
    admins = await getPlatformAdmins();
  } catch (error) {
    console.error("[PlatformAdminsPage] failed to load admins", error);
    loadFailed = true;
  }

  if (loadFailed || !admins) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Platform Admins
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage verified admin accounts and platform permissions.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          <p className="font-semibold">Could not load platform admins right now</p>
          <p className="mt-1">
            The database request timed out or failed temporarily. Refresh the page in a
            moment. If this keeps happening, check database connectivity and Neon pooler
            health.
          </p>
        </div>
      </div>
    );
  }

  return <AdminsWorkspace admins={admins} />;
}
