import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
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
  const session = await requireUserSession();

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      org: {
        select: {
          name: true,
        },
      },
    },
  });

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
    <div className="min-h-screen bg-neutral-50">
      <TenantSidebar fullName={tenant.fullName} />

      <TenantHeader
        fullName={tenant.fullName}
        orgName={tenant.org.name}
      />

      <TenantFooter />

      <div className="min-h-screen lg:pl-[290px]">
        <main className="px-4 pb-24 pt-32 sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
          {children}
        </main>
      </div>
    </div>
  );
}