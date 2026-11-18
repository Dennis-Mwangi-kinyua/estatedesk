import test from "node:test";
import assert from "node:assert/strict";
import { configureTestDatabase } from "./database-safety";
import { createSupportService } from "../../apps/web/src/features/customer-support/application/service";
const databaseUrl = configureTestDatabase();
test("support threads isolate customers and allow platform support replies", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { supportRepository } = await import("../../apps/web/src/features/customer-support/infrastructure/prisma-repository");
  const service = createSupportService({ repository: supportRepository, allowMutation: async () => true });
  const owner = await prisma.user.create({ data: { fullName: "Support owner", passwordHash: "test-only" } });
  const other = await prisma.user.create({ data: { fullName: "Other customer", passwordHash: "test-only" } });
  try {
    const actor = { userId: owner.id, platformRole: "USER" };
    const foreign = { userId: other.id, platformRole: "USER" };
    const agent = { userId: other.id, platformRole: "PLATFORM_ADMIN" };
    const id = await service.create(actor, { subject: "Test request", category: "TECHNICAL", body: "Initial issue description" });
    assert.equal(await service.find(foreign, id), null);
    await assert.rejects(service.resolve(foreign, id), /unavailable/);
    await assert.rejects(service.reply(foreign, { ticketId: id, body: "Foreign reply" }), /unavailable/);
    assert.ok(await service.find(agent, id));
    await service.reply(agent, { ticketId: id, body: "Support response" });
    await service.resolve(actor, id);
    assert.equal((await service.find(actor, id))?.status, "RESOLVED");
    await service.reply(actor, { ticketId: id, body: "I still need help" });
    const thread = await service.find(actor, id);
    assert.equal(thread?.replies.length, 3);
    assert.equal(thread?.status, "OPEN");
  } finally { await prisma.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } }); await prisma.$disconnect(); }
});
