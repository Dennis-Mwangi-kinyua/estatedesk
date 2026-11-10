import { z } from "zod";
import { dateInput } from "@/features/org-management/policy";
export const COLLECTION_TASK = "Rent collection follow-up";
export const collectionViews = ["all", "today", "mine", "unassigned", "broken", "payment-review"] as const;
export const followUpSchema = z.object({ tenantId: z.string().min(1).max(100), assigneeId: z.string().min(1).max(100), date: dateInput, note: z.string().trim().min(5).max(2000), requestKey: z.string().uuid() });
export const reminderSchema = z.object({ tenantId: z.string().min(1).max(100), channel: z.enum(["EMAIL", "IN_APP"]), version: z.string().length(64), approved: z.literal("yes"), requestKey: z.string().uuid() });
export function reminderText(name: string, amount: string, currency: string, date: string) {
  return `Hello ${name}, our records as of ${date} show overdue rent of ${new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(Number(amount))}. Please review your statement or contact the office if you have already paid or need to agree a payment plan. Thank you.`;
}
