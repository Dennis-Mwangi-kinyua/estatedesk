/**
 * Auth SDK — shared session claim types for future multi-service auth.
 * Phase 1: type contracts only. Session I/O still lives in apps/web.
 */

export type OrgRoleClaim =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "CARETAKER"
  | "LANDLORD"
  | "TENANT"
  | string;

export type PlatformRoleClaim = "NONE" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN" | string;

export type ScopeTypeClaim = "ORG" | "PROPERTY" | "BUILDING" | "UNIT" | string;

export type SessionClaims = {
  userId: string;
  email: string | null;
  fullName: string;
  platformRole: PlatformRoleClaim;
  activeOrgId: string | null;
  activeOrgRole: OrgRoleClaim | null;
  mustChangePassword: boolean;
  requiresTermsAcceptance: boolean;
  membershipScope: {
    scopeType: ScopeTypeClaim;
    scopeId: string;
  } | null;
};

export type ServiceAuthContext = {
  userId: string;
  orgId: string | null;
  orgRole: OrgRoleClaim | null;
  platformRole: PlatformRoleClaim;
  correlationId?: string;
};

export const AUTH_SERVICE = {
  name: "auth",
  version: "0.1.0",
  status: "in-process" as const,
};
