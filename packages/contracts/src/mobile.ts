import { z } from "zod";

export const mobileSessionSchema = z.object({
  fullName: z.string(),
  role: z.string().nullable(),
  organizationName: z.string().nullable(),
  requiresAccountSetup: z.boolean(),
  mustChangePassword: z.boolean().default(false),
  requiresTermsAcceptance: z.boolean().default(false),
  organizationId: z.string().nullable().default(null),
  currencyCode: z.string().length(3).default("KES"),
  canViewBills: z.boolean().default(true),
});
export type MobileSession = z.infer<typeof mobileSessionSchema>;

export const mobileLoginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(1024),
});
export const mobileLoginResponseSchema = z.object({
  // A signed session cookie, transported explicitly by the native client only.
  sessionCookie: z.string().min(1),
});

export const mobileBillsSchema = z.object({
  organizationName: z.string(),
  currencyCode: z.string(),
  totalBalance: z.number(),
  bills: z.array(z.object({
    id: z.string(),
    label: z.string(),
    period: z.string(),
    dueDate: z.string(),
    amountDue: z.number(),
    balance: z.number(),
    status: z.string(),
    source: z.enum(["RENT_CHARGE", "WATER_BILL", "PERIOD_BILL"]).optional(),
  })),
});
export type MobileBills = z.infer<typeof mobileBillsSchema>;

export const mobileMembershipsSchema = z.array(z.object({
  id: z.string(), organizationId: z.string(), organizationName: z.string(), role: z.string(),
}));
export const mobileSetupSchema = z.object({
  currentPassword: z.string().max(1024), newPassword: z.string().max(1024),
  confirmPassword: z.string().max(1024), acceptedTerms: z.literal(true),
});
export const mobileIssueInputSchema = z.object({
  unitId: z.string().min(1).max(200), title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});
export const mobileIssuesSchema = z.object({
  units: z.array(z.object({ id: z.string(), label: z.string() })),
  issues: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), status: z.string(), priority: z.string(), createdAt: z.string() })),
});
export const mobileReadingInputSchema = z.object({
  unitId: z.string().min(1).max(200), period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  currentReading: z.number().int().min(0).max(2147483647), notes: z.string().max(500).default(""),
});
export const mobileMetersSchema = z.object({
  period: z.string(), units: z.array(z.object({ id: z.string(), label: z.string(), previousReading: z.number() })),
});
export const mobilePaymentInputSchema = z.object({
  source: z.enum(["rent_charge", "water_bill", "period_bill"]), id: z.string().min(1).max(200),
  method: z.enum(["mpesa-stk", "manual-mpesa", "manual-bank"]),
  amount: z.number().positive().max(100000000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "Use at most two decimal places."),
  phoneNumber: z.string().max(30).optional(), accountName: z.string().max(200).optional(),
  transactionId: z.string().max(100).optional(), proofMessage: z.string().max(5000).optional(),
});
export const mobilePaymentMethodsSchema = z.array(z.object({ id: z.string(), name: z.string(), instructions: z.string() }));
export const mobileNotificationsSchema = z.array(z.object({
  id: z.string(), title: z.string(), message: z.string(), createdAt: z.string(), readAt: z.string().nullable(),
}));
export type MobileIssues = z.infer<typeof mobileIssuesSchema>;
export type MobileMeters = z.infer<typeof mobileMetersSchema>;
export type MobilePaymentInput = z.infer<typeof mobilePaymentInputSchema>;
export const mobilePaymentHistorySchema = z.array(z.object({
  id: z.string(), amount: z.number(), gatewayStatus: z.string(), verificationStatus: z.string(),
  createdAt: z.string(), reference: z.string().nullable(),
}));
