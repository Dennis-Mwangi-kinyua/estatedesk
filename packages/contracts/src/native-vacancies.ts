import { z } from "zod";

const vacancyCardSchema = z.object({ id: z.string(), slug: z.string(), title: z.string(), subtitle: z.string(), type: z.string(), bedrooms: z.number().nullable(), rent: z.number(), deposit: z.number().nullable(), imageUrl: z.string().nullable() });
export const nativeVacancyListSchema = z.object({ page: z.number(), total: z.number(), hasMore: z.boolean(), items: z.array(vacancyCardSchema) });
export const nativeVacancyDetailSchema = vacancyCardSchema.extend({ description: z.string(), location: z.string(), address: z.string().nullable(), bathrooms: z.number().nullable(), serviceCharge: z.number().nullable(), viewingFee: z.number().nullable(), organization: z.string() });
export const nativeVacancyInquirySchema = z.object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().min(5).max(30), email: z.union([z.literal(""), z.email().max(160)]), message: z.string().trim().min(5).max(2000), preferredLocation: z.string().max(120).default(""), budget: z.string().max(80).default(""), referralSource: z.string().max(120).default("") });
export type NativeVacancyCard = z.infer<typeof vacancyCardSchema>;
export type NativeVacancyDetail = z.infer<typeof nativeVacancyDetailSchema>;
export type NativeVacancyInquiry = z.infer<typeof nativeVacancyInquirySchema>;
