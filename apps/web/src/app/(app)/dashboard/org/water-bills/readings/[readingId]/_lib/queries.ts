import { prisma } from "@/lib/prisma";
import {
  decodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { orgMeterReadingDetailSelect } from "../../../_lib/reading-select";
import { getOrgWaterReadingHref } from "../../../_lib/helpers";

export async function getOrgWaterReadingDetailData({
  orgId,
  publicReadingId,
}: {
  orgId: string;
  publicReadingId: string;
}) {
  let readingId = publicReadingId;
  try {
    readingId = decodePublicId(publicReadingId, "meter-reading");
  } catch {
    readingId = publicReadingId;
  }

  const reading = await prisma.meterReading.findFirst({
    where: {
      id: readingId,
      unit: {
        property: {
          orgId,
          deletedAt: null,
        },
      },
    },
    select: orgMeterReadingDetailSelect,
  });

  if (!reading) {
    return {
      ok: false as const,
      notFound: true,
      redirectTo: null as string | null,
    };
  }

  const redirectTo = !isEncodedPublicId(publicReadingId)
    ? getOrgWaterReadingHref(reading.id)
    : null;

  return {
    ok: true as const,
    notFound: false,
    redirectTo,
    reading,
  };
}
