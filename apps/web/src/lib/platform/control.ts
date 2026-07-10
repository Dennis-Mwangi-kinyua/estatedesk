import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLATFORM_FEATURE_FLAG_KEYS } from "@/app/(app)/platform/_lib/nav";

export const PLATFORM_CONTROL_ID = "global";

export type PlatformControlState = {
  id: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  incidentMode: boolean;
  incidentMessage: string | null;
  publicSignupDisabled: boolean;
  publicApiDisabled: boolean;
  webhooksDisabled: boolean;
  cronDisabled: boolean;
  tenantPortalsDisabled: boolean;
  orgDashboardsDisabled: boolean;
  globalFeatures: Record<string, boolean>;
  notes: string | null;
  lastBackupAt: Date | null;
  lastBackupNote: string | null;
  lastBackupStatus: string | null;
  updatedByUserId: string | null;
  updatedAt: Date;
};

const DEFAULT_CONTROL: Omit<PlatformControlState, "updatedAt"> = {
  id: PLATFORM_CONTROL_ID,
  maintenanceMode: false,
  maintenanceMessage: null,
  incidentMode: false,
  incidentMessage: null,
  publicSignupDisabled: false,
  publicApiDisabled: false,
  webhooksDisabled: false,
  cronDisabled: false,
  tenantPortalsDisabled: false,
  orgDashboardsDisabled: false,
  globalFeatures: {},
  notes: null,
  lastBackupAt: null,
  lastBackupNote: null,
  lastBackupStatus: null,
  updatedByUserId: null,
};

function asFeatureMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, boolean> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = Boolean(item);
  }
  return result;
}

function mapRow(row: {
  id: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  incidentMode?: boolean;
  incidentMessage?: string | null;
  publicSignupDisabled: boolean;
  publicApiDisabled: boolean;
  webhooksDisabled: boolean;
  cronDisabled: boolean;
  tenantPortalsDisabled: boolean;
  orgDashboardsDisabled: boolean;
  globalFeatures: unknown;
  notes: string | null;
  lastBackupAt?: Date | null;
  lastBackupNote?: string | null;
  lastBackupStatus?: string | null;
  updatedByUserId: string | null;
  updatedAt: Date;
}): PlatformControlState {
  return {
    id: row.id,
    maintenanceMode: row.maintenanceMode,
    maintenanceMessage: row.maintenanceMessage,
    incidentMode: Boolean(row.incidentMode),
    incidentMessage: row.incidentMessage ?? null,
    publicSignupDisabled: row.publicSignupDisabled,
    publicApiDisabled: row.publicApiDisabled,
    webhooksDisabled: row.webhooksDisabled,
    cronDisabled: row.cronDisabled,
    tenantPortalsDisabled: row.tenantPortalsDisabled,
    orgDashboardsDisabled: row.orgDashboardsDisabled,
    globalFeatures: asFeatureMap(row.globalFeatures),
    notes: row.notes,
    lastBackupAt: row.lastBackupAt ?? null,
    lastBackupNote: row.lastBackupNote ?? null,
    lastBackupStatus: row.lastBackupStatus ?? null,
    updatedByUserId: row.updatedByUserId,
    updatedAt: row.updatedAt,
  };
}

export async function ensurePlatformControl() {
  return prisma.platformControl.upsert({
    where: { id: PLATFORM_CONTROL_ID },
    create: { id: PLATFORM_CONTROL_ID },
    update: {},
  });
}

export async function getPlatformControl(): Promise<PlatformControlState> {
  try {
    const row = await prisma.platformControl.findUnique({
      where: { id: PLATFORM_CONTROL_ID },
    });

    if (!row) {
      const created = await ensurePlatformControl();
      return mapRow(created);
    }

    return mapRow(row);
  } catch {
    return {
      ...DEFAULT_CONTROL,
      updatedAt: new Date(0),
    };
  }
}

export type PlatformControlPatch = Partial<{
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  incidentMode: boolean;
  incidentMessage: string | null;
  publicSignupDisabled: boolean;
  publicApiDisabled: boolean;
  webhooksDisabled: boolean;
  cronDisabled: boolean;
  tenantPortalsDisabled: boolean;
  orgDashboardsDisabled: boolean;
  globalFeatures: Record<string, boolean>;
  notes: string | null;
  lastBackupAt: Date | null;
  lastBackupNote: string | null;
  lastBackupStatus: string | null;
}>;

export async function updatePlatformControl(
  patch: PlatformControlPatch,
  actorUserId: string,
): Promise<PlatformControlState> {
  await ensurePlatformControl();

  const data: Prisma.PlatformControlUpdateInput = {
    updatedByUserId: actorUserId,
  };

  if (patch.maintenanceMode !== undefined) data.maintenanceMode = patch.maintenanceMode;
  if (patch.maintenanceMessage !== undefined) {
    data.maintenanceMessage = patch.maintenanceMessage;
  }
  if (patch.incidentMode !== undefined) data.incidentMode = patch.incidentMode;
  if (patch.incidentMessage !== undefined) data.incidentMessage = patch.incidentMessage;
  if (patch.publicSignupDisabled !== undefined) {
    data.publicSignupDisabled = patch.publicSignupDisabled;
  }
  if (patch.publicApiDisabled !== undefined) data.publicApiDisabled = patch.publicApiDisabled;
  if (patch.webhooksDisabled !== undefined) data.webhooksDisabled = patch.webhooksDisabled;
  if (patch.cronDisabled !== undefined) data.cronDisabled = patch.cronDisabled;
  if (patch.tenantPortalsDisabled !== undefined) {
    data.tenantPortalsDisabled = patch.tenantPortalsDisabled;
  }
  if (patch.orgDashboardsDisabled !== undefined) {
    data.orgDashboardsDisabled = patch.orgDashboardsDisabled;
  }
  if (patch.notes !== undefined) data.notes = patch.notes;
  if (patch.lastBackupAt !== undefined) data.lastBackupAt = patch.lastBackupAt;
  if (patch.lastBackupNote !== undefined) data.lastBackupNote = patch.lastBackupNote;
  if (patch.lastBackupStatus !== undefined) data.lastBackupStatus = patch.lastBackupStatus;
  if (patch.globalFeatures !== undefined) {
    data.globalFeatures = patch.globalFeatures as Prisma.InputJsonObject;
  }

  const row = await prisma.platformControl.update({
    where: { id: PLATFORM_CONTROL_ID },
    data,
  });

  return mapRow(row);
}

export function defaultMaintenanceMessage(control: PlatformControlState) {
  return (
    control.maintenanceMessage?.trim() ||
    "EstateDesk is temporarily under platform maintenance. Please try again shortly."
  );
}

export function defaultIncidentMessage(control: PlatformControlState) {
  return (
    control.incidentMessage?.trim() ||
    "EstateDesk is investigating a platform incident. Some features may be degraded."
  );
}

export function isGlobalFeatureForcedOff(
  control: PlatformControlState,
  key: (typeof PLATFORM_FEATURE_FLAG_KEYS)[number] | string,
) {
  return control.globalFeatures[key] === false;
}

export function isGlobalFeatureForcedOn(
  control: PlatformControlState,
  key: (typeof PLATFORM_FEATURE_FLAG_KEYS)[number] | string,
) {
  return control.globalFeatures[key] === true;
}
