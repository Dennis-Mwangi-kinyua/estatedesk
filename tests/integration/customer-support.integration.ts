import test from "node:test";
import assert from "node:assert/strict";
import { configureTestDatabase } from "./database-safety";
import { supportTicketWhere } from "../../apps/web/src/features/customer-support/policy";
const databaseUrl = configureTestDatabase();
test("support threads isolate customers and allow platform support replies", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const owner = await prisma.user.create({ data: { fullName: "Support owner", passwordHash: "test-only" } });
  const other = await prisma.user.create({ data: { fullName: "Other customer", passwordHash: "test-only" } });
  try {
    const ticket = await prisma.supportTicket.create({ data: { ownerId: owner.id, subject: "Test request", category: "TECHNICAL", replies: { create: { authorId: owner.id, body: "Initial issue description" } } } });
    assert.equal(await prisma.supportTicket.findFirst({ where: { id: ticket.id, ...supportTicketWhere(other.id, "USER") } }), null);
    const denied = await prisma.supportTicket.updateMany({ where: { id: ticket.id, ...supportTicketWhere(other.id, "USER") }, data: { status: "RESOLVED" } });
    assert.equal(denied.count, 0);
    assert.ok(await prisma.supportTicket.findFirst({ where: { id: ticket.id, ...supportTicketWhere(other.id, "PLATFORM_ADMIN") } }));
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: "RESOLVED" } });
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: "OPEN", replies: { create: { authorId: owner.id, body: "I still need help" } } } });
    assert.equal(await prisma.supportReply.count({ where: { ticketId: ticket.id } }), 2);
    assert.equal((await prisma.supportTicket.findUniqueOrThrow({ where: { id: ticket.id } })).status, "OPEN");
  } finally { await prisma.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } }); await prisma.$disconnect(); }
});
