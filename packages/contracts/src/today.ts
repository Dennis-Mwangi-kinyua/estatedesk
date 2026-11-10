import { z } from "zod";

export const todayItemSchema = z.object({
  id: z.string(), title: z.string(), detail: z.string(), action: z.string(),
  href: z.string().regex(/^\/(?!\/)/),
  urgency: z.enum(["overdue", "today", "normal"]),
  dueAt: z.string().datetime().nullable(),
  native: z.object({
    screen: z.enum(["notifications", "bills", "issues", "work-orders", "gate", "portfolio", "leases", "workspace"]),
    kind: z.enum(["organization", "platform", "landlord"]).optional(),
    path: z.string().optional(),
  }).nullable(),
});
export const todaySummarySchema = z.object({
  generatedAt: z.string().datetime(), timeZone: z.literal("Africa/Nairobi"),
  name: z.string(), workspace: z.string(),
  sections: z.array(z.object({ id: z.string(), title: z.string(), hasMore: z.boolean(), items: z.array(todayItemSchema) })),
});
export type TodayItem = z.infer<typeof todayItemSchema>;
export type TodaySummary = z.infer<typeof todaySummarySchema>;
