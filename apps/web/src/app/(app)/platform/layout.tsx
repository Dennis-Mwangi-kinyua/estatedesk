import { cookies } from "next/headers";
import { ReactNode } from "react";
import { requirePlatformRole } from "@/lib/permissions/guards";
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
  const initialPreferredMode: PlatformMode =
    parsePlatformModeCookie(cookieStore.get(PLATFORM_MODE_COOKIE_NAME)?.value) ??
    "admin";

  return (
    <PlatformShell
      fullName={session.fullName}
      isSuperAdmin={session.platformRole === "SUPER_ADMIN"}
      initialPreferredMode={initialPreferredMode}
    >
      {children}
    </PlatformShell>
  );
}
