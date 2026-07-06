import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PencilLine } from "lucide-react";
import { TenantWorkspace } from "@/components/theme/ed-dashboard-shell";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { panelShellClassName } from "../_components/profile-ui";
import { EditProfileForm } from "./_components/edit-profile-form";
import { getTenantProfileData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function EditTenantProfilePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  const { tenant } = await getTenantProfileData(
    session.userId,
    session.activeOrgId,
  );

  if (!tenant) {
    return (
      <TenantWorkspace className="max-w-3xl">
        <section className={`${panelShellClassName} border-amber-200 bg-amber-50 p-6 text-amber-900`}>
          No tenant profile is linked to your account.
        </section>
      </TenantWorkspace>
    );
  }

  return (
    <TenantWorkspace className="max-w-3xl">
      <section className={panelShellClassName}>
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <Link
            href="/dashboard/tenant/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <PencilLine className="h-3.5 w-3.5" />
            Edit profile
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Update your details
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Update your phone, email, and next of kin. Your name, ID, and lease
            terms are managed by the property office.
          </p>
        </div>
      </section>

      <EditProfileForm tenant={tenant} />
    </TenantWorkspace>
  );
}