import { notFound, redirect } from "next/navigation";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";
import { MeterEntryWorkspace } from "./_components/meter-entry-workspace";
import { getCaretakerMeterEntryData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ period?: string }>;
};

export default async function ReadSingleWaterBillPage({
  params,
  searchParams,
}: PageProps) {
  const { unitId: publicUnitId } = await params;
  const unitId = decodePublicId(publicUnitId, "unit");
  const { period } = await searchParams;
  const currentPeriod = period ?? CURRENT_PERIOD;
  const session = await requireCaretakerAccess();

  const allowedUnitIds = await getCaretakerAllowedUnitIds({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  if (!allowedUnitIds.includes(unitId)) {
    notFound();
  }

  if (!isEncodedPublicId(publicUnitId)) {
    redirect(
      `/dashboard/caretaker/water-bills/read/${encodePublicId(
        unitId,
        "unit",
      )}?period=${currentPeriod}`,
    );
  }

  const data = await getCaretakerMeterEntryData({
    unitId,
    period: currentPeriod,
  });

  if (data.ok && !data.unit) {
    notFound();
  }

  return <MeterEntryWorkspace data={data} />;
}