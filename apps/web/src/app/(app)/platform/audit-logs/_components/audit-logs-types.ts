import { Prisma } from "@prisma/client";

export type AuditLogItem = Prisma.AuditLogGetPayload<{
  select: {
    id: true;
    createdAt: true;
    action: true;
    entityType: true;
    entityId: true;
    requestId: true;
    ip: true;
    userAgent: true;
    metadata: true;
    actor: {
      select: {
        id: true;
        fullName: true;
        email: true;
        platformRole: true;
      };
    };
    org: {
      select: {
        id: true;
        name: true;
        slug: true;
        status: true;
      };
    };
  };
}>;