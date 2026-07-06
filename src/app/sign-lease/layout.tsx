import { ReactNode } from "react";
import { getUserSession } from "@/lib/auth/session";
import { SensitiveDataWatermark } from "@/components/security/sensitive-data-watermark";
import { prisma } from "@/lib/prisma";

export default async function SignLeaseLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getUserSession();

  if (!session) {
    return <div className="min-h-screen">{children}</div>;
  }

  let orgLabel: string | null = null;

  if (session.activeOrgId) {
    const organization = await prisma.organization.findUnique({
      where: { id: session.activeOrgId },
      select: { name: true },
    });
    orgLabel = organization?.name ?? null;
  }

  return (
    <div className="app-sensitive-surface relative min-h-screen">
      <SensitiveDataWatermark orgLabel={orgLabel} />
      {children}
    </div>
  );
}