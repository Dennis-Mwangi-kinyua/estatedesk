import { z } from "zod";

const optional = (max: number) => z.string().trim().max(max).transform(value => value || null);
export const vacancyInquiryInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30).regex(/^\+?[\d\s().-]+$/),
  email: z.union([z.literal(""), z.email().max(254)]).transform(value => value || null),
  message: z.string().trim().min(5).max(3000),
  preferredLocation: optional(200),
  budget: z.string().trim().max(30).refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), "Enter a valid budget.").transform(value => value || null),
  referralSource: z.enum(["", "search", "social", "referral", "agent", "other"]).transform(value => value || null),
});
