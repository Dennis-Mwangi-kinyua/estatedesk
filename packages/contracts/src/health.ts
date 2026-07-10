import { z } from "zod";

export const healthStatusSchema = z.enum(["ok", "degraded"]);

export const healthResponseSchema = z.object({
  service: z.string(),
  status: healthStatusSchema,
  checkedAt: z.string(),
  uptimeSeconds: z.number().optional(),
  latencyMs: z.number().optional(),
  environment: z
    .object({
      ready: z.boolean(),
      configured: z.number(),
      total: z.number(),
      missingRequired: z.array(z.string()).optional(),
    })
    .optional(),
  database: z
    .object({
      checked: z.boolean(),
      status: z.enum(["ok", "error"]).optional(),
      latencyMs: z.number().optional(),
    })
    .optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
