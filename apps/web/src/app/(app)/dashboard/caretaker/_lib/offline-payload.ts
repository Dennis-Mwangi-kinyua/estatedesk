import { z } from "zod";

export type OfflineQueueScope = { orgId: string; userId: string; allowedUnitIds?: readonly string[] };
const id = z.string().trim().min(1).max(120);
const photo = z.object({ base64: z.string().min(1).max(7_000_000), fileName: z.string().min(1).max(200), mimeType: z.string().max(100).startsWith("image/"), size: z.number().int().positive().max(5 * 1024 * 1024) });
const base = { id, createdAt: z.string().datetime(), owner: z.object({ orgId: id, userId: id }), photoKey: z.string().max(400).optional(), photoPayload: photo.optional() };
export const offlineMeterReadingSchema = z.object({ ...base, kind: z.literal("meter_reading"), unitId: id, leaseId: id.optional(), period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), prevReading: z.number().int().min(0).max(2_147_483_647), currentReading: z.number().int().min(0).max(2_147_483_647), notes: z.string().trim().max(500).optional() }).refine(item => item.currentReading >= item.prevReading, { message: "Current reading cannot be lower than the previous reading.", path: ["currentReading"] });
const issue = z.object({ ...base, kind: z.literal("issue"), title: z.string().trim().min(3).max(160), description: z.string().trim().min(5).max(4000), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]), unitId: id.optional(), propertyId: id.optional() });
const inspection = z.object({ ...base, kind: z.literal("inspection"), unitId: id.optional(), propertyId: id.optional(), notes: z.string().trim().min(1).max(4000), roomStatuses: z.array(z.object({ room: z.string().max(80), status: z.string().max(80) })).max(100).optional() });
export const offlineQueueItemSchema = z.union([offlineMeterReadingSchema, issue, inspection]);
export type OfflineMeterReadingItem = z.infer<typeof offlineMeterReadingSchema>;
export type OfflineIssueItem = z.infer<typeof issue>;
export type OfflineInspectionItem = z.infer<typeof inspection>;
export type OfflineQueueItem = z.infer<typeof offlineQueueItemSchema>;
export type OfflinePhotoPayload = z.infer<typeof photo>;
export function offlineScopeKey(scope: Pick<OfflineQueueScope, "orgId" | "userId">) { return `${encodeURIComponent(scope.orgId)}:${encodeURIComponent(scope.userId)}`; }
