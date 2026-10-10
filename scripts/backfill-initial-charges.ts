import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "../apps/web/src/lib/prisma";
import { backfillInitialCharges } from "../apps/web/src/lib/billing/backfill-initial-charges";

async function main() {
  const apply = process.argv.includes("--apply");
  const orgId = process.argv.find(value => value.startsWith("--org="))?.slice(6);
  let actorUserId = process.argv.find(value => value.startsWith("--actor="))?.slice(8);
  if (apply && !actorUserId && process.argv.includes("--system-actor")) {
    const id = "system-initial-charges-backfill";
    const actor = await prisma.user.upsert({ where: { id }, update: {}, create: { id, fullName: "System: initial charge backfill", status: "DISABLED", passwordHash: await hash(randomBytes(32).toString("hex"), 10) }, include: { _count: { select: { memberships: true } } } });
    if (actor.status !== "DISABLED" || actor.platformRole !== "USER" || actor._count.memberships) throw new Error("System audit actor must be disabled and have no privileges.");
    actorUserId = actor.id;
  }
  if (apply && !actorUserId) throw new Error("Supply --actor=<userId> or --system-actor when applying, for the audit trail.");
  const leases = await prisma.lease.findMany({ where: orgId ? { orgId } : {}, select: { id: true, orgId: true, monthlyRent: true, deposit: true, org: { select: { currencyCode: true } } }, orderBy: { id: "asc" } });
  const results = [];
  for (const lease of leases) {
    const result = await prisma.$transaction(tx => backfillInitialCharges(tx, lease.id, apply, actorUserId), { isolationLevel: "Serializable", timeout: 15_000 });
    const amount = result.missing.reduce((sum, type) => sum.add((type === "RENT" ? lease.monthlyRent : lease.deposit) ?? 0), lease.monthlyRent.mul(0));
    results.push({ ...result, orgId: lease.orgId, amount: amount.toFixed(2), currencyCode: lease.org.currencyCode });
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", results }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
