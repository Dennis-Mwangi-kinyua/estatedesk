import { z } from "zod";

export const mobileImportKindSchema = z.enum(["properties", "units", "tenants"]);
export const mobileImportRequestSchema = z.object({
  kind: mobileImportKindSchema,
  csv: z.string().min(1).max(250_000),
  mode: z.enum(["dry-run", "commit"]),
  validationToken: z.string().max(2000).optional(),
  confirmImport: z.literal("yes").optional(),
  submissionId: z.string().uuid(),
});
export const mobileImportResultSchema = z.object({
  ok: z.boolean(), dryRun: z.boolean(), kind: mobileImportKindSchema,
  totalRows: z.number(), validRows: z.number(), created: z.number(),
  message: z.string(), errors: z.array(z.string()), preview: z.array(z.string()),
  rowResults: z.array(z.object({ line: z.number(), label: z.string(), status: z.enum(["valid", "error"]), errors: z.array(z.string()) })),
  rollbackSummary: z.string().optional(), runId: z.string().optional(), validationToken: z.string().optional(),
});
export const mobileImportTemplateSchema = z.object({ template: z.string() });
export type MobileImportKind = z.infer<typeof mobileImportKindSchema>;
export type MobileImportRequest = z.infer<typeof mobileImportRequestSchema>;
export type MobileImportResult = z.infer<typeof mobileImportResultSchema>;
