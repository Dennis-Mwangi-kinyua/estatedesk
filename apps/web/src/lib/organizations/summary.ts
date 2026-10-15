import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

/** Request-scoped only: share layout/guard reads without caching access across requests. */
export const getOrganizationSummary = cache((orgId: string) =>
  retryTransientDatabaseOperation(
    () => prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, status: true, deletedAt: true },
    }),
    { label: "organization-summary" },
  ),
);
