import "server-only";
import { prisma } from "@/lib/prisma";
import type { SupportRepository } from "../application/ports";
export const supportRepository: SupportRepository = {
  async create(ownerId, subject, category, body) {
    const ticket = await prisma.supportTicket.create({ data: { ownerId, subject, category, replies: { create: { authorId: ownerId, body } } } });
    return ticket.id;
  },
  list(scope, page) {
    return prisma.supportTicket.findMany({ where: scope, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 21, select: { id: true, subject: true, category: true, status: true } });
  },
  find(scope, id) {
    return prisma.supportTicket.findFirst({ where: { id, ...scope }, include: { replies: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100, include: { author: { select: { fullName: true } } } } } });
  },
  reply(scope, id, authorId, body) {
    return prisma.$transaction(async tx => {
      const changed = await tx.supportTicket.updateMany({ where: { id, ...scope }, data: { status: "OPEN", updatedAt: new Date() } });
      if (changed.count !== 1) return false;
      await tx.supportReply.create({ data: { ticketId: id, authorId, body } });
      return true;
    });
  },
  async resolve(scope, id) {
    return (await prisma.supportTicket.updateMany({ where: { id, ...scope }, data: { status: "RESOLVED" } })).count === 1;
  },
};
