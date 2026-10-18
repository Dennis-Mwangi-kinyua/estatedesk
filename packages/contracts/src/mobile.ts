import { z } from "zod";
export * from "./mobile-native-services";

export const mobileFeatureSchema = z.enum(["leases", "move-outs", "caretaker-issues", "portfolio", "documents", "payment-review", "inspections", "visitors", "gate"]);
export type MobileFeature = z.infer<typeof mobileFeatureSchema>;

export const mobileSessionSchema = z.object({
  platformRole: z.enum(["USER", "SUPER_ADMIN", "PLATFORM_ADMIN"]).default("USER"),
  userId: z.string().default(""),
  fullName: z.string(),
  role: z.string().nullable(),
  organizationName: z.string().nullable(),
  requiresAccountSetup: z.boolean(),
  mustChangePassword: z.boolean().default(false),
  requiresTermsAcceptance: z.boolean().default(false),
  organizationId: z.string().nullable().default(null),
  currencyCode: z.string().length(3).default("KES"),
  canViewBills: z.boolean().default(true),
  features: z.array(mobileFeatureSchema).default([]),
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
  issues: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), status: z.string(), priority: z.string(), createdAt: z.string(),
    resolution: z.object({ id: z.string(), workSummary: z.string(), materialsUsed: z.string().nullable(), tenantInstructions: z.string().nullable() }).nullable().optional(),
  })),
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

export const mobileLeasesSchema = z.array(z.object({
  id: z.string(), propertyName: z.string(), unitLabel: z.string(), buildingName: z.string().nullable(),
  status: z.string(), startDate: z.string(), endDate: z.string().nullable(),
  monthlyRent: z.number(), deposit: z.number().nullable(), dueDay: z.number(),
}));
export const mobileMoveOutsSchema = z.array(z.object({
  id: z.string(), propertyName: z.string(), unitLabel: z.string(), status: z.string(),
  noticeDate: z.string(), moveOutDate: z.string(), inspectionAt: z.string().nullable(),
  inspectionStatus: z.string().nullable(),
}));
export const mobileWorkOrdersSchema = z.array(z.object({
  id: z.string(), title: z.string(), description: z.string(), status: z.string(), priority: z.string(),
  unitLabel: z.string().nullable(), propertyName: z.string().nullable(), createdAt: z.string(),
  progressNotes: z.string().nullable(), canStart: z.boolean(), canUpdate: z.boolean(),
  pendingReport: z.boolean(), reportStatus: z.string().nullable(),
}));
export const mobileWorkOrderInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), issueId: z.string().min(1).max(200) }),
  z.object({ action: z.literal("note"), issueId: z.string().min(1).max(200), progressNote: z.string().trim().min(4).max(2000) }),
  z.object({ action: z.literal("complete"), issueId: z.string().min(1).max(200), workSummary: z.string().trim().min(10).max(5000), materialsUsed: z.string().trim().max(2000).default(""), tenantInstructions: z.string().trim().max(2000).default("") }),
]);
export type MobileWorkOrderInput = z.infer<typeof mobileWorkOrderInputSchema>;
export const mobilePortfolioQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "VACANT", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const mobilePortfolioSchema = z.object({
  total: z.number().int(), page: z.number().int(), totalPages: z.number().int(),
  units: z.array(z.object({ id: z.string(), houseNo: z.string(), propertyName: z.string(), buildingName: z.string().nullable(), type: z.string(), status: z.string(), rentAmount: z.number(), isActive: z.boolean() })),
});

export const mobileDocumentsSchema = z.array(z.object({
  id: z.string(), kind: z.enum(["receipt", "lease"]), title: z.string(), date: z.string(),
}));
export const mobilePaymentReviewInputSchema = z.object({
  id: z.string().min(1).max(200), action: z.enum(["verify", "reject"]), note: z.string().trim().min(5).max(2000),
});
export const mobilePaymentReviewSchema = z.object({
  page: z.number(), hasMore: z.boolean(), payments: z.array(z.object({
    id: z.string(), amount: z.number(), method: z.string(), reference: z.string().nullable(),
    payer: z.string(), proof: z.string().nullable(), createdAt: z.string(),
  })),
});
export const mobileInspectionFields = [
  { name: "cleanlinessOk", label: "Cleanliness is acceptable" },
  { name: "wallsOk", label: "Walls are in good condition" },
  { name: "doorsWindowsOk", label: "Doors and windows are okay" },
  { name: "plumbingOk", label: "Plumbing is okay" },
  { name: "electricalOk", label: "Electrical fixtures are okay" },
  { name: "keysReturned", label: "Keys have been returned" },
  { name: "meterReadingsTaken", label: "Meter readings captured" },
  { name: "damageObserved", label: "Damage has been observed" },
] as const;
export const mobileInspectionInputSchema = z.object({
  inspectionId: z.string().min(1).max(200), summary: z.string().trim().min(1).max(2000),
  recommendations: z.string().trim().max(2000),
  cleanlinessOk: z.enum(["yes", "no"]), wallsOk: z.enum(["yes", "no"]),
  doorsWindowsOk: z.enum(["yes", "no"]), plumbingOk: z.enum(["yes", "no"]),
  electricalOk: z.enum(["yes", "no"]), keysReturned: z.enum(["yes", "no"]),
  meterReadingsTaken: z.enum(["yes", "no"]), damageObserved: z.enum(["yes", "no"]),
}).refine(value => value.damageObserved !== "yes" || !!value.recommendations, "Describe damage and recommended repairs.");
export const mobileInspectionsSchema = z.array(z.object({
  id: z.string(), reference: z.string(), unit: z.string(), property: z.string(),
  scheduledAt: z.string(), status: z.string(), summary: z.string().nullable(), recommendations: z.string().nullable(),
}));
export const mobileVisitorInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), visitorName: z.string().trim().min(2).max(120), visitorPhone: z.string().max(25), vehiclePlate: z.string().max(25), validFrom: z.iso.datetime({ offset: true }), validUntil: z.iso.datetime({ offset: true }) }),
  z.object({ action: z.literal("revoke"), id: z.string().min(1).max(200) }),
  z.object({ action: z.literal("verify"), token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }),
  z.object({ action: z.literal("admit"), id: z.string().min(1).max(200) }),
]);
export const mobileVisitorsSchema = z.array(z.object({
  id: z.string(), visitorName: z.string(), validFrom: z.string(), validUntil: z.string(), status: z.string(),
}));
export const mobileVisitorResultSchema = z.object({
  message: z.string().optional(), url: z.string().optional(), qr: z.string().optional(),
  pass: z.object({ id: z.string(), visitorName: z.string(), visitorPhone: z.string().nullable(), vehiclePlate: z.string().nullable(), tenant: z.string(), unit: z.string(), property: z.string(), validFrom: z.string(), validUntil: z.string(), status: z.string() }).optional(),
});

export type MobileVisitorInput = z.infer<typeof mobileVisitorInputSchema>;
export { tenantWorkspaceLinks, tenantWorkspaceEntry, tenantNavigation, tenantDocumentPath } from "./tenant-workspace";
export { mobileWorkspaceKindSchema, mobileWorkspaceDashboardSchema, type MobileWorkspaceKind, type MobileWorkspaceDashboard, type MobileWorkspaceLink } from "./workspace-dashboard";

export const mobileCommunitySchema = z.array(z.object({
  id: z.string(), title: z.string(), message: z.string(), organizationName: z.string(),
  publishedAt: z.string(), readAt: z.string().nullable(),
}));
export const mobileNoticeReadSchema = z.object({ id: z.string().min(1).max(200) });
export const mobileExpenditureInputSchema = z.object({
  description: z.string().trim().min(3).max(1000),
  amount: z.number().positive().max(100000000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001),
  incurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }),
  category: z.enum(["TENANT_REPAIR", "TENANT_SERVICE", "TRANSPORT", "OTHER"]),
  payee: z.string().trim().max(200).default(""), reference: z.string().trim().max(200).default(""), notes: z.string().trim().max(2000).default(""),
});
export const mobileExpendituresSchema = z.object({
  page: z.number().int(), hasMore: z.boolean(), currencyCode: z.string().length(3),
  items: z.array(z.object({ id: z.string(), description: z.string(), amount: z.number(), currencyCode: z.string().length(3), category: z.string(), incurredAt: z.string(), status: z.string() })),
});

export type MobileExpenditureInput = z.infer<typeof mobileExpenditureInputSchema>;
export const mobileProfileInputSchema = z.object({
  phone: z.string().trim().min(1).max(30), email: z.union([z.literal(""), z.email().max(120)]),
  nextOfKinName: z.string().trim().min(1).max(200), nextOfKinRelationship: z.string().trim().min(1).max(100),
  nextOfKinPhone: z.string().trim().min(1).max(30), nextOfKinEmail: z.union([z.literal(""), z.email().max(120)]),
});
export const mobileProfileSchema = z.object({
  fullName: z.string(), phone: z.string(), email: z.string(),
  nextOfKinName: z.string(), nextOfKinRelationship: z.string(), nextOfKinPhone: z.string(), nextOfKinEmail: z.string(),
});
export type MobileProfileInput = z.infer<typeof mobileProfileInputSchema>;
export { nativeWorkspaceQuerySchema, nativeWorkspacePageSchema, nativeLegalSchema, type NativeWorkspaceRecord, type NativeWorkspacePage } from "./native-workspace";
export { nativeActionDefinitionSchema, nativeActionRequestSchema, nativeActionResultSchema, nativeActionFormData, type NativeActionLink, type NativeActionDefinition, type NativeActionField, type NativeActionRequest, type NativeActionResult } from "./native-actions";
