import { z } from "zod";
export const reportMetricSchema = z.enum(["organizations", "subscriptions", "payment-volume", "issues", "notifications", "attention"]);
export const reportFiltersSchema = z.object({
  reportPeriod: z.enum(["today", "month", "lastMonth", "custom"]).default("month"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  metric: reportMetricSchema.default("organizations"),
  organization: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
export const reportMetadataSchema = z.object({
  generatedAt: z.string(), windowStart: z.string(), windowEnd: z.string(), previousStart: z.string(), previousEnd: z.string(), from: z.string(), to: z.string(), previousFrom: z.string(), previousTo: z.string(),
  scopeName: z.string(), metric: reportMetricSchema,
  organizations: z.array(z.object({ id: z.string(), name: z.string(), current: z.number(), previous: z.number(), attention: z.number(), amounts: z.array(z.object({ currency: z.string(), current: z.string(), previous: z.string() })) })),
  hasMore: z.boolean(),
});
export type ReportMetadata = z.infer<typeof reportMetadataSchema>;
export const reportExportSchema = z.object({ filename: z.string(), content: z.string().max(16000000), mimeType: z.enum(["application/pdf", "text/csv"]) });
