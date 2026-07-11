"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BillingPlan, OrganizationStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { sendSecurityAlert } from "@/lib/security/alerts";
import {
  runNotificationCron,
  runOwnerStatementCron,
  runRetentionCron,
} from "@/lib/cron/jobs";
import {
  getPlatformControl,
  updatePlatformControl,
  type PlatformControlPatch,
} from "@/lib/platform/control";
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  type PlatformFeatureFlagKey,
} from "../_lib/nav";

const PAGE = "/platform/control";
const SUPER_REDIRECT = {
  redirectTo: "/platform/developer?error=super-admin-only",
} as const;

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readBool(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").toLowerCase();
  return value === "true" || value === "on" || value === "1";
}

function confirmPhrase(formData: FormData, expected: string) {
  return readString(formData, "confirmation") === expected;
}

async function requireSuperAdmin() {
  return requirePlatformRole(["SUPER_ADMIN"], SUPER_REDIRECT);
}

function refreshControl() {
  revalidatePath(PAGE);
  revalidatePath("/platform/developer");
  revalidatePath("/platform");
}

export async function updateKillSwitchesAction(formData: FormData) {
  const session = await requireSuperAdmin();

  const before = await getPlatformControl();
  const patch: PlatformControlPatch = {
    maintenanceMode: readBool(formData, "maintenanceMode"),
    maintenanceMessage: readString(formData, "maintenanceMessage") || null,
    incidentMode: readBool(formData, "incidentMode"),
    incidentMessage: readString(formData, "incidentMessage") || null,
    publicSignupDisabled: readBool(formData, "publicSignupDisabled"),
    publicApiDisabled: readBool(formData, "publicApiDisabled"),
    webhooksDisabled: readBool(formData, "webhooksDisabled"),
    cronDisabled: readBool(formData, "cronDisabled"),
    tenantPortalsDisabled: readBool(formData, "tenantPortalsDisabled"),
    orgDashboardsDisabled: readBool(formData, "orgDashboardsDisabled"),
    notes: readString(formData, "notes") || null,
  };

  const after = await updatePlatformControl(patch, session.userId);

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_KILL_SWITCHES_UPDATED",
    entityType: "PlatformControl",
    entityId: "global",
    beforeState: {
      maintenanceMode: before.maintenanceMode,
      publicSignupDisabled: before.publicSignupDisabled,
      publicApiDisabled: before.publicApiDisabled,
      webhooksDisabled: before.webhooksDisabled,
      cronDisabled: before.cronDisabled,
      tenantPortalsDisabled: before.tenantPortalsDisabled,
      orgDashboardsDisabled: before.orgDashboardsDisabled,
    },
    afterState: {
      maintenanceMode: after.maintenanceMode,
      publicSignupDisabled: after.publicSignupDisabled,
      publicApiDisabled: after.publicApiDisabled,
      webhooksDisabled: after.webhooksDisabled,
      cronDisabled: after.cronDisabled,
      tenantPortalsDisabled: after.tenantPortalsDisabled,
      orgDashboardsDisabled: after.orgDashboardsDisabled,
    },
  });

  await sendSecurityAlert({
    event: "PLATFORM_KILL_SWITCHES_UPDATED",
    severity: after.maintenanceMode ? "critical" : "warning",
    actorUserId: session.userId,
    summary: `${session.fullName} updated platform kill switches (maintenance=${after.maintenanceMode}).`,
  });

  refreshControl();
  redirect(`${PAGE}?ok=kill-switches`);
}

export async function updateGlobalFeatureKillAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const featureKey = readString(formData, "featureKey");
  const mode = readString(formData, "mode"); // on | off | inherit

  if (!(PLATFORM_FEATURE_FLAG_KEYS as readonly string[]).includes(featureKey)) {
    redirect(`${PAGE}?error=invalid-feature`);
  }

  const control = await getPlatformControl();
  const next = { ...control.globalFeatures };

  if (mode === "inherit") {
    delete next[featureKey];
  } else if (mode === "on") {
    next[featureKey] = true;
  } else if (mode === "off") {
    next[featureKey] = false;
  } else {
    redirect(`${PAGE}?error=invalid-mode`);
  }

  await updatePlatformControl({ globalFeatures: next }, session.userId);

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_GLOBAL_FEATURE_KILL_UPDATED",
    entityType: "PlatformControl",
    entityId: featureKey,
    metadata: { mode, featureKey },
  });

  refreshControl();
  revalidatePath("/platform/feature-flags");
  redirect(`${PAGE}?ok=global-feature`);
}

export async function forceOrgStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const orgId = readString(formData, "orgId");
  const status = readString(formData, "status").toUpperCase() as OrganizationStatus;

  if (!orgId || !["ACTIVE", "SUSPENDED", "DISABLED"].includes(status)) {
    redirect(`${PAGE}?error=org-status`);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, slug: true, status: true },
  });
  if (!org) redirect(`${PAGE}?error=org-missing`);

  await prisma.organization.update({
    where: { id: org.id },
    data: { status },
  });

  if (status !== "ACTIVE") {
    await prisma.userSession.updateMany({
      where: { activeMembership: { orgId: org.id } },
      data: { activeMembershipId: null },
    });
  }

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_ORG_STATUS_FORCED",
    entityType: "Organization",
    entityId: org.id,
    beforeState: { status: org.status },
    afterState: { status },
    metadata: { slug: org.slug, name: org.name },
  });

  await sendSecurityAlert({
    event: "PLATFORM_ORG_STATUS_FORCED",
    severity: status === "ACTIVE" ? "warning" : "critical",
    actorUserId: session.userId,
    entityType: "Organization",
    entityId: org.id,
    summary: `${session.fullName} forced ${org.name} status to ${status}.`,
  });

  refreshControl();
  revalidatePath(`/platform/organizations/${org.slug}`);
  redirect(`${PAGE}?ok=org-status`);
}

export async function forceAllOrgsFeatureAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const featureKey = readString(formData, "featureKey") as PlatformFeatureFlagKey;
  const enabled = readBool(formData, "enabled");

  if (!(PLATFORM_FEATURE_FLAG_KEYS as readonly string[]).includes(featureKey)) {
    redirect(`${PAGE}?error=invalid-feature`);
  }

  if (!confirmPhrase(formData, "FORCE-ALL-ORGS")) {
    redirect(`${PAGE}?error=confirm-force-all`);
  }

  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true, settings: { select: { features: true } } },
  });

  let updated = 0;
  for (const org of orgs) {
    const features =
      org.settings?.features &&
      typeof org.settings.features === "object" &&
      !Array.isArray(org.settings.features)
        ? { ...(org.settings.features as Record<string, unknown>) }
        : {};
    features[featureKey] = enabled;

    await prisma.organizationSettings.upsert({
      where: { orgId: org.id },
      create: { orgId: org.id, features: features as object },
      update: { features: features as object },
    });
    updated += 1;
  }

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_FORCE_FEATURE_ALL_ORGS",
    entityType: "OrganizationSettings",
    entityId: featureKey,
    metadata: { enabled, updated },
  });

  await sendSecurityAlert({
    event: "PLATFORM_FORCE_FEATURE_ALL_ORGS",
    severity: "critical",
    actorUserId: session.userId,
    summary: `${session.fullName} forced feature ${featureKey}=${enabled} on ${updated} organizations.`,
  });

  revalidatePath("/platform/feature-flags");
  refreshControl();
  redirect(`${PAGE}?ok=force-all-features&count=${updated}`);
}

export async function overrideSubscriptionAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const orgId = readString(formData, "orgId");
  const plan = readString(formData, "plan").toUpperCase() as BillingPlan;
  const status = readString(formData, "status").toUpperCase() as SubscriptionStatus;

  if (!orgId || !Object.values(BillingPlan).includes(plan)) {
    redirect(`${PAGE}?error=subscription`);
  }
  if (!Object.values(SubscriptionStatus).includes(status)) {
    redirect(`${PAGE}?error=subscription`);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, slug: true, name: true, subscription: true },
  });
  if (!org) redirect(`${PAGE}?error=org-missing`);

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existingMeta =
    org.subscription?.metadata &&
    typeof org.subscription.metadata === "object" &&
    !Array.isArray(org.subscription.metadata)
      ? (org.subscription.metadata as Record<string, unknown>)
      : {};

  // Clear pending upgrade requests when platform forces a plan.
  const nextMeta = {
    ...existingMeta,
    amountDue: 0,
    upgradeRequest:
      existingMeta.upgradeRequest &&
      typeof existingMeta.upgradeRequest === "object" &&
      !Array.isArray(existingMeta.upgradeRequest)
        ? {
            ...(existingMeta.upgradeRequest as Record<string, unknown>),
            status: "APPLIED",
            appliedAt: now.toISOString(),
            appliedByUserId: session.userId,
            resolutionNotes: "Applied via Website Control subscription override",
          }
        : existingMeta.upgradeRequest,
  };

  const sub = await prisma.subscription.upsert({
    where: { orgId: org.id },
    create: {
      orgId: org.id,
      plan,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      metadata: nextMeta as object,
    },
    update: {
      plan,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelledAt: status === "CANCELLED" ? now : null,
      metadata: nextMeta as object,
    },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_SUBSCRIPTION_OVERRIDE",
    entityType: "Subscription",
    entityId: sub.id,
    metadata: { orgId: org.id, plan, status, slug: org.slug },
  });

  refreshControl();
  revalidatePath("/platform/subscriptions");
  revalidatePath("/platform/billing");
  revalidatePath(`/platform/organizations/${org.slug}`);
  redirect(`${PAGE}?ok=subscription`);
}

export async function forceUserStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const identifier = readString(formData, "identifier").toLowerCase();
  const status = readString(formData, "status").toUpperCase();

  if (!identifier || !["ACTIVE", "SUSPENDED", "DISABLED"].includes(status)) {
    redirect(`${PAGE}?error=user-status`);
  }

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ email: identifier }, { username: identifier }, { id: identifier }],
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      status: true,
      isRootSuperAdmin: true,
      platformRole: true,
    },
  });

  if (!user) redirect(`${PAGE}?error=user-missing`);
  if (user.isRootSuperAdmin) redirect(`${PAGE}?error=root-protected`);
  if (user.id === session.userId) redirect(`${PAGE}?error=self-protected`);

  await prisma.user.update({
    where: { id: user.id },
    data: { status: status as "ACTIVE" | "SUSPENDED" | "DISABLED" },
  });

  if (status !== "ACTIVE") {
    await prisma.userSession.deleteMany({ where: { userId: user.id } });
  }

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_USER_STATUS_FORCED",
    entityType: "User",
    entityId: user.id,
    beforeState: { status: user.status },
    afterState: { status },
    metadata: { email: user.email, username: user.username },
  });

  refreshControl();
  redirect(`${PAGE}?ok=user-status`);
}

export async function forcePasswordChangeAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const identifier = readString(formData, "identifier").toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ email: identifier }, { username: identifier }, { id: identifier }],
    },
    select: { id: true, email: true, username: true, isRootSuperAdmin: true },
  });

  if (!user) redirect(`${PAGE}?error=user-missing`);
  if (user.isRootSuperAdmin) redirect(`${PAGE}?error=root-protected`);

  await prisma.user.update({
    where: { id: user.id },
    data: { mustChangePassword: true },
  });
  await prisma.userSession.deleteMany({ where: { userId: user.id } });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_FORCE_PASSWORD_CHANGE",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, username: user.username },
  });

  refreshControl();
  redirect(`${PAGE}?ok=force-password`);
}

export async function revokeAllSessionsAction(formData: FormData) {
  const session = await requireSuperAdmin();

  if (!confirmPhrase(formData, "REVOKE-ALL-SESSIONS")) {
    redirect(`${PAGE}?error=confirm-sessions`);
  }

  const result = await prisma.userSession.deleteMany({
    where: { userId: { not: session.userId } },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_REVOKE_ALL_SESSIONS",
    entityType: "UserSession",
    entityId: "global",
    metadata: { deleted: result.count },
  });

  await sendSecurityAlert({
    event: "PLATFORM_REVOKE_ALL_SESSIONS",
    severity: "critical",
    actorUserId: session.userId,
    summary: `${session.fullName} revoked ${result.count} sessions platform-wide (kept own sessions).`,
  });

  refreshControl();
  redirect(`${PAGE}?ok=sessions&count=${result.count}`);
}

export async function revokeAllApiKeysAction(formData: FormData) {
  const session = await requireSuperAdmin();

  if (!confirmPhrase(formData, "REVOKE-ALL-API-KEYS")) {
    redirect(`${PAGE}?error=confirm-api-keys`);
  }

  const result = await prisma.apiKey.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_REVOKE_ALL_API_KEYS",
    entityType: "ApiKey",
    entityId: "global",
    metadata: { revoked: result.count },
  });

  await sendSecurityAlert({
    event: "PLATFORM_REVOKE_ALL_API_KEYS",
    severity: "critical",
    actorUserId: session.userId,
    summary: `${session.fullName} revoked ${result.count} active API keys.`,
  });

  revalidatePath("/platform/api-keys");
  refreshControl();
  redirect(`${PAGE}?ok=api-keys&count=${result.count}`);
}

export async function clearAllRateLimitsAction(formData: FormData) {
  const session = await requireSuperAdmin();

  if (!confirmPhrase(formData, "CLEAR-RATE-LIMITS")) {
    redirect(`${PAGE}?error=confirm-rate-limits`);
  }

  const result = await prisma.rateLimitBucket.deleteMany({});

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_CLEAR_ALL_RATE_LIMITS",
    entityType: "RateLimitBucket",
    entityId: "global",
    metadata: { deleted: result.count },
  });

  revalidatePath("/platform/rate-limits");
  refreshControl();
  redirect(`${PAGE}?ok=rate-limits&count=${result.count}`);
}

export async function purgeFailedNotificationsAction(formData: FormData) {
  const session = await requireSuperAdmin();

  if (!confirmPhrase(formData, "PURGE-FAILED-NOTIFICATIONS")) {
    redirect(`${PAGE}?error=confirm-purge`);
  }

  const result = await prisma.notification.deleteMany({
    where: { status: "FAILED" },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_PURGE_FAILED_NOTIFICATIONS",
    entityType: "Notification",
    entityId: "global",
    metadata: { deleted: result.count },
  });

  revalidatePath("/platform/jobs");
  refreshControl();
  redirect(`${PAGE}?ok=purge-notifications&count=${result.count}`);
}

export async function runAllCronJobsAction(formData: FormData) {
  const session = await requireSuperAdmin();

  if (!confirmPhrase(formData, "RUN-ALL-CRONS")) {
    redirect(`${PAGE}?error=confirm-crons`);
  }

  const control = await getPlatformControl();
  if (control.cronDisabled) {
    redirect(`${PAGE}?error=cron-disabled`);
  }

  const [notifications, retention, ownerStatements] = await Promise.allSettled([
    runNotificationCron({ triggerSource: "manual", actorUserId: session.userId }),
    runRetentionCron({ triggerSource: "manual", actorUserId: session.userId }),
    runOwnerStatementCron({ triggerSource: "manual", actorUserId: session.userId }),
  ]);

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_RUN_ALL_CRONS",
    entityType: "CronJobRun",
    entityId: "manual-batch",
    metadata: {
      notifications: notifications.status,
      retention: retention.status,
      ownerStatements: ownerStatements.status,
    },
  });

  revalidatePath("/platform/jobs");
  refreshControl();
  redirect(`${PAGE}?ok=crons`);
}

export async function enterOrgAsSupportAction(formData: FormData) {
  // Reuse timed support session flow (super-admin via website control).
  const { enterOrgSupportAccessAction } = await import(
    "@/app/(app)/platform/support-access/actions"
  );
  await enterOrgSupportAccessAction(formData);
}

export async function softDeleteOrgAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const orgId = readString(formData, "orgId");
  const slug = readString(formData, "slug");

  if (!orgId || !confirmPhrase(formData, slug)) {
    redirect(`${PAGE}?error=confirm-soft-delete`);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, slug: true, name: true, deletedAt: true },
  });
  if (!org || org.deletedAt) redirect(`${PAGE}?error=org-missing`);

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      deletedAt: new Date(),
      status: "DISABLED",
    },
  });

  await prisma.userSession.updateMany({
    where: { activeMembership: { orgId: org.id } },
    data: { activeMembershipId: null },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_ORG_SOFT_DELETED",
    entityType: "Organization",
    entityId: org.id,
    metadata: { slug: org.slug, name: org.name },
  });

  refreshControl();
  redirect(`${PAGE}?ok=soft-delete`);
}

export async function restoreOrgAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const orgId = readString(formData, "orgId");

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, slug: true, name: true, deletedAt: true },
  });
  if (!org) redirect(`${PAGE}?error=org-missing`);

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      deletedAt: null,
      status: "ACTIVE",
    },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_ORG_RESTORED",
    entityType: "Organization",
    entityId: org.id,
    metadata: { slug: org.slug, name: org.name },
  });

  refreshControl();
  redirect(`${PAGE}?ok=restore-org`);
}
