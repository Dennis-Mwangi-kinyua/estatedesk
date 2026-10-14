import { z } from "zod";
export const SERVICE_CATEGORIES = ["Plumbing", "Electrical", "Cleaning", "Painting", "Carpentry", "Security", "Landscaping", "General maintenance"] as const;
const webUrl = z.string().trim().max(1000).refine(value => !value || (() => { try { return new URL(value).protocol === "https:"; } catch { return false; } })(), "Use a full HTTPS URL.");
export const profileSchema = z.object({ businessName: z.string().trim().min(2).max(120), category: z.enum(SERVICE_CATEGORIES), location: z.string().trim().min(2).max(160), bio: z.string().trim().min(20).max(3000), portfolioUrl: webUrl });
export const portfolioSchema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().min(10).max(2000), location: z.string().trim().min(2).max(160), imageUrl: webUrl });
export const jobSchema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().min(20).max(3000), category: z.enum(SERVICE_CATEGORIES), location: z.string().trim().min(2).max(160), budget: z.string().trim().refine(value => !value || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 9999999999), "Enter a positive budget, with at most two decimal places.") });
export const reviewSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().min(5).max(2000) });
export const ONLINE_WINDOW_MS = 5 * 60_000;
export function providerIsOnline(lastSeenAt: Date | null, now = new Date()) { return Boolean(lastSeenAt && lastSeenAt.getTime() <= now.getTime() && lastSeenAt.getTime() >= now.getTime() - ONLINE_WINDOW_MS); }
