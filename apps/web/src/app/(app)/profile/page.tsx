import { requireAuthenticated } from "@/lib/permissions/guards";
import { ProfilePicturePanel } from "@/components/uploads/profile-picture-panel";
import { AccountProfileShell } from "@/components/layout/account-profile-shell";
export const dynamic = "force-dynamic";
export default async function ProfilePage() {
  const session = await requireAuthenticated();
  const roleLabel = session.platformRole === "SUPER_ADMIN"
    ? "Platform super admin"
    : session.platformRole === "PLATFORM_ADMIN"
      ? "Platform admin"
      : session.activeOrgRole
        ? session.activeOrgRole.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, character => character.toUpperCase())
        : "EstateDesk account";

  return <AccountProfileShell fullName={session.fullName} roleLabel={roleLabel}>
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-primary">Account settings</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">My profile</h2>
        <p className="mt-2 text-muted-foreground">Manage how your account appears across EstateDesk.</p>
      </header>
      <ProfilePicturePanel />
    </div>
  </AccountProfileShell>;
}
