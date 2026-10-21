import { z } from "zod";

export const mobileWorkspaceKindSchema = z.enum(["organization", "platform", "landlord"]);
export type MobileWorkspaceKind = z.infer<typeof mobileWorkspaceKindSchema>;
export const mobileWorkspaceLinkSchema = z.object({
  title: z.string(), path: z.string(), description: z.string(), emoji: z.string(), group: z.string(),
});
export const mobileWorkspaceDashboardSchema = z.object({
  kind: mobileWorkspaceKindSchema,
  links: z.array(mobileWorkspaceLinkSchema),
  metrics: z.array(z.object({ title: z.string(), value: z.string(), detail: z.string(), emoji: z.string(), path: z.string() })),
  updates: z.array(z.object({ id: z.string(), title: z.string(), message: z.string(), createdAt: z.string() })),
  partial: z.boolean(), updatedAt: z.string(),
});
export type MobileWorkspaceDashboard = z.infer<typeof mobileWorkspaceDashboardSchema>;
export type MobileWorkspaceLink = z.infer<typeof mobileWorkspaceLinkSchema>;
