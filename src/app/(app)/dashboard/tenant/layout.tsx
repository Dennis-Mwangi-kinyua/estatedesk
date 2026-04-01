import { ReactNode } from "react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { TenantHeader } from "./tenant-header";
import { TenantSidebar } from "./tenant-sidebar";

type TenantLayoutProps = {
  children: ReactNode;
};

export default async function TenantLayout({ children }: TenantLayoutProps) {
  const session = await requireTenantAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in tenant session");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-neutral-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[290px_1fr]">
        <TenantSidebar fullName={session.fullName} />

        <div className="min-w-0">
          <TenantHeader
            fullName={session.fullName}
            activeOrgId={session.activeOrgId}
          />

          <main className="px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}