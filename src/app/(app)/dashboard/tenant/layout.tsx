import { ReactNode } from "react";
import { getCurrentTenantShell } from "@/lib/tenant/get-current-tenant";
import { TenantHeader } from "./tenant-header";
import { TenantSidebar } from "./tenant-sidebar";
import { TenantFooter } from "./tenant-footer";

export const dynamic = "force-dynamic";

type TenantLayoutProps = {
  children: ReactNode;
};

export default async function TenantLayout({
  children,
}: TenantLayoutProps) {
  const tenant = await getCurrentTenantShell();

  if (!tenant) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          No tenant profile is linked to your account.
        </div>
      </div>
    );
  }

  return (
    <div className="app-mobile-canvas min-h-screen">
      <TenantSidebar fullName={tenant.fullName} />
      <TenantHeader fullName={tenant.fullName} orgName={tenant.org.name} />
      <TenantFooter />

      <div className="min-h-screen lg:pl-[300px] xl:pl-[320px]">
        <main className="px-3 pb-32 pt-[104px] sm:px-5 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="app-content-shell">{children}</div>
        </main>
      </div>
    </div>
  );
}
