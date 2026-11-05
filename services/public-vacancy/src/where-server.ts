import "server-only";

import type { Prisma } from "@prisma/client";
import { getPlatformControl } from "@/lib/platform/control";
import { publicListedVacancyWhere, publicVacancyFeatureWhere } from "./where";

export async function getPublicListedVacancyWhere(): Promise<Prisma.UnitWhereInput> {
  const control = await getPlatformControl();
  return { ...publicListedVacancyWhere, AND: [publicVacancyFeatureWhere(control.globalFeatures)] };
}
