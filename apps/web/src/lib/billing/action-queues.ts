import "server-only";
import { prisma } from "@/lib/prisma";
import { AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
export async function platformActionCounts() {
  const now = new Date();
  const [overdue,upgrades,countersignatures] = await Promise.all([
    prisma.subscription.count({where:{org:{deletedAt:null},plan:{not:"FREE"},OR:[{status:"PAST_DUE"},{status:"ACTIVE",currentPeriodEnd:{lt:now}},{status:"TRIALING",trialEndsAt:{lt:now}}]}}),
    prisma.subscription.count({where:{org:{deletedAt:null},metadata:{path:["upgradeRequest","status"],equals:"PENDING"}}}),
    prisma.documentRecord.count({where:{entityType:AGREEMENT_ENTITY,status:"ISSUED",org:{deletedAt:null},metadata:{path:["organizationSignature","userId"],not:""}}}),
  ]);
  return {overdue,upgrades,countersignatures};
}
