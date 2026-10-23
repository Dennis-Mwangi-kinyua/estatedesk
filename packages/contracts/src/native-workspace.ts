import { z } from "zod";
import { reportMetadataSchema, reportFiltersSchema } from "./platform-reports";
import { nativeActionLinkSchema } from "./native-actions";

export const nativeWorkspaceQuerySchema = z.object({
  reportPeriod: reportFiltersSchema.shape.reportPeriod.optional(),
  from: reportFiltersSchema.shape.from, to: reportFiltersSchema.shape.to, metric: reportFiltersSchema.shape.metric.optional(),
  kind: z.enum(["organization", "platform", "landlord"]),
  path: z.string().min(1).max(200),
  recordId: z.string().min(1).max(200).optional(),
  organization: z.string().min(1).max(200).optional(),
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const nativeWorkspaceRecordSchema = z.object({
  id: z.string(), title: z.string(), subtitle: z.string().default(""),
  status: z.string().optional(),
  organizationGroup: z.string().optional(),
  fields: z.array(z.object({ label: z.string(), value: z.string() })),
  links: z.array(z.object({ title: z.string(), path: z.string(), recordId: z.string().optional(), emoji: z.string(), description: z.string() })).optional(),
  actions: z.array(nativeActionLinkSchema).optional(),
});
export const nativeWorkspacePageSchema = z.object({
  report: reportMetadataSchema.optional(),
  title: z.string(), description: z.string(), emoji: z.string(),
  page: z.number().int().positive(), hasMore: z.boolean(),
  records: z.array(nativeWorkspaceRecordSchema),
  notice: z.string().optional(),
  searchable: z.boolean().default(true),
  actions: z.array(nativeActionLinkSchema).optional(),
  related: z.array(z.object({ title: z.string(), path: z.string(), emoji: z.string(), description: z.string() })),
});
export type NativeWorkspaceRecord = z.infer<typeof nativeWorkspaceRecordSchema>;
export type NativeWorkspacePage = z.infer<typeof nativeWorkspacePageSchema>;
export const nativeLegalSchema = z.object({
  title: z.string(), description: z.string(), updatedAt: z.string(),
  sections: z.array(z.object({ title: z.string(), body: z.array(z.string()) })),
});
export const nativeGuestStaySchema = z.object({
  guestName: z.string(), checkIn: z.string(), checkOut: z.string(), listing: z.string(), location: z.string(), host: z.string(),
  requests: z.array(z.object({ id: z.string(), message: z.string(), createdAt: z.string(), resolved: z.boolean() })),
});
export type NativeGuestStay = z.infer<typeof nativeGuestStaySchema>;
