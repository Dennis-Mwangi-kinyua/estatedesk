import { notFound, redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { ReadingDetailWorkspace } from "./_components/reading-detail-workspace";
import { getOrgWaterReadingDetailData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ readingId: string }>;
};

export default async function OrgWaterReadingDetailPage({ params }: PageProps) {
  const session = await requireOrgRole([
    "ADMIN",
    "MANAGER",
    "OFFICE",
    "ACCOUNTANT",
  ]);
  const { readingId: publicReadingId } = await params;

  const data = await getOrgWaterReadingDetailData({
    orgId: session.activeOrgId!,
    publicReadingId,
  });

  if (data.notFound || !data.ok) {
    notFound();
  }

  if (data.redirectTo) {
    redirect(data.redirectTo);
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.activeOrgId! },
    select: { currencyCode: true, timezone: true },
  });

  return (
    <ReadingDetailWorkspace
      reading={data.reading}
      currencyCode={org?.currencyCode ?? "KES"}
      timezone={org?.timezone ?? "Africa/Nairobi"}
    />
  );
}
