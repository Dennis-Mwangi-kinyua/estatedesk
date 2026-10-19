import { z } from "zod";

export const mobileSecuritySchema = z.array(z.object({
  id: z.string(), createdAt: z.string(), lastSeenAt: z.string(), expiresAt: z.string(),
  ipAddress: z.string().nullable(), userAgent: z.string().nullable(), isCurrent: z.boolean(),
}));
export const mobileSecurityInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revoke"), sessionId: z.string().min(1).max(200) }),
  z.object({ action: z.literal("revoke-others") }),
  z.object({ action: z.literal("password"), currentPassword: z.string().min(1).max(1024), newPassword: z.string().min(8).max(1024), confirmPassword: z.string().min(8).max(1024) }),
]);
export type MobileSecurityInput = z.infer<typeof mobileSecurityInputSchema>;
export const mobileIssueConfirmationSchema = z.object({ issueId: z.string().min(1).max(200), reportId: z.string().min(1).max(200), tenantFeedback: z.string().trim().max(2000) });
export const mobileRewardsSchema = z.object({
  points: z.number(), availablePoints: z.number(), redeemedPoints: z.number(), tier: z.string(),
  streakMonths: z.number(), earlyPayments: z.number(), onTimePayments: z.number(),
  nextTier: z.string().nullable(), pointsToNextTier: z.number().nullable(),
  catalog: z.array(z.object({ id: z.string(), label: z.string(), description: z.string(), category: z.string(), pointsCost: z.number() })),
  redemptions: z.array(z.object({ id: z.string(), label: z.string(), pointsCost: z.number(), status: z.string(), createdAt: z.string(), fulfilledAt: z.string().nullable() })),
});
export const mobileRewardInputSchema = z.object({ rewardId: z.string().min(1).max(100) });
export const mobileMoveOutInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("submit"), moveOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), notes: z.string().trim().max(1000) }),
  z.object({ action: z.literal("withdraw"), noticeId: z.string().min(1).max(200) }),
]);
export type MobileMoveOutInput = z.infer<typeof mobileMoveOutInputSchema>;
export const mobileLeaseSigningSchema = z.array(z.object({
  id: z.string(), leaseId: z.string(), name: z.string(), unitLabel: z.string(), consentText: z.string(),
  sourceDocumentHash: z.string(), expiresAt: z.string(), canSign: z.boolean(),
}));
export const mobileLeaseSigningInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("sign"), signerId: z.string().min(1).max(200), signatureText: z.string().trim().min(2).max(200), consent: z.literal(true), sourceDocumentHash: z.string().min(1).max(200), signatureMethod: z.enum(["TYPED", "DRAWN", "UPLOADED"]).default("TYPED"), signatureData: z.string().max(350000).optional() }),
  z.object({ action: z.literal("decline"), signerId: z.string().min(1).max(200), reason: z.string().trim().min(5).max(1000), sourceDocumentHash: z.string().min(1).max(200) }),
]);
export type MobileLeaseSigningInput = z.infer<typeof mobileLeaseSigningInputSchema>;
export const mobileTenantInspectionsSchema = z.object({
  page: z.number(), hasMore: z.boolean(), items: z.array(z.object({
    id: z.string(), unitLabel: z.string(), status: z.string(), scheduledAt: z.string(), completedAt: z.string().nullable(),
    inspectorName: z.string(), notes: z.string().nullable(), checklist: z.record(z.string(), z.unknown()).nullable(), reportPath: z.string(),
    photos: z.array(z.object({ id: z.string(), label: z.string() })).default([]),
  })),
});
