import { ProductUpdatesBanner } from "@/features/updates/banner";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { PlatformShell } from "./_components/platform-shell";
import {
  parsePlatformModeCookie,
  PLATFORM_MODE_COOKIE_NAME,
  type PlatformMode,
} from "./_lib/nav";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const cookieStore = await cookies();
  const [pendingProviderCount, pendingDemoCount] = await Promise.all([
    prisma.serviceProvider.count({ where: { status: "PENDING" } }),
    prisma.onboardingRequest.count({ where: { source: "DEMO_REQUEST", salesStage: "NEW" } }),
  ]);
  const initialPreferredMode: PlatformMode =
    parsePlatformModeCookie(cookieStore.get(PLATFORM_MODE_COOKIE_NAME)?.value) ??
    "admin";

  return (
    <PlatformShell
      fullName={session.fullName}
      isSuperAdmin={session.platformRole === "SUPER_ADMIN"}
      pendingProviderCount={pendingProviderCount}
      pendingDemoCount={pendingDemoCount}
      initialPreferredMode={initialPreferredMode}
    >
      <ProductUpdatesBanner userId={session.userId} audience={session.platformRole as "PLATFORM_ADMIN" | "SUPER_ADMIN"} />
      {children}
    </PlatformShell>
  );
}
