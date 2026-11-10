import type { Prisma } from "@prisma/client";

/** Current associations only; historical employment/archived profiles do not lock former users. */
export function associatedOrganizationUsers(org: Prisma.OrganizationWhereInput): Prisma.UserWhereInput {
  return { OR: [
    { memberships: { some: { org, deactivatedAt: null, employmentEndedAt: null } } },
    { tenant: { some: { org, deletedAt: null, archivedAt: null } } },
    { landlordProfiles: { some: { org, deletedAt: null, isActive: true } } },
  ] };
}
export const blacklistedOrganizationUsers = () => associatedOrganizationUsers({ blacklistedAt: { not: null } });

export class OrganizationBlacklistedError extends Error {
  constructor() { super("Your account is linked to a blacklisted organization. Contact EstateDesk support."); this.name = "OrganizationBlacklistedError"; }
}
