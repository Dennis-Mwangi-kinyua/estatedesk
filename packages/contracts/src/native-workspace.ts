import { z } from "zod";
import { nativeActionLinkSchema } from "./native-actions";

export const nativeWorkspaceQuerySchema = z.object({
  kind: z.enum(["organization", "platform"]),
  path: z.string().min(1).max(200),
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const nativeWorkspaceRecordSchema = z.object({
  id: z.string(), title: z.string(), subtitle: z.string().default(""),
  status: z.string().optional(),
  fields: z.array(z.object({ label: z.string(), value: z.string() })),
  actions: z.array(nativeActionLinkSchema).optional(),
});
export const nativeWorkspacePageSchema = z.object({
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
