import { z } from "zod";

export const BNB_TYPES = ["APARTMENT", "STUDIO", "HOUSE", "VILLA", "COTTAGE", "PRIVATE_ROOM"] as const;
export const BNB_AMENITIES = ["Wi-Fi", "Kitchen", "Free parking", "Swimming pool", "Air conditioning", "TV", "Washing machine", "Workspace", "Balcony", "Security", "Hot water", "Pet friendly"] as const;
export const MAX_BNB_PHOTOS = 8;
export const MAX_BNB_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_BNB_UPLOAD_BYTES = 6 * 1024 * 1024;
const money = z.coerce.number().finite().min(0).max(9999999999.99).refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.0001, "Use at most two decimal places.");
const optionalText = (max: number) => z.string().trim().max(max).transform((v) => v || null);
export const bnbSchema = z.object({
  title: z.string().trim().min(5, "Enter a title of at least 5 characters.").max(120),
  description: z.string().trim().min(30, "Describe the stay in at least 30 characters.").max(5000),
  location: z.string().trim().min(2).max(160),
  address: optionalText(220),
  propertyType: z.enum(BNB_TYPES),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(1).max(50),
  beds: z.coerce.number().int().min(1).max(100),
  maxGuests: z.coerce.number().int().min(1).max(100),
  nightlyRate: money.refine((n) => n > 0, "Enter a nightly rate greater than zero."),
  cleaningFee: money,
  minimumNights: z.coerce.number().int().min(1).max(365),
  amenities: z.array(z.enum(BNB_AMENITIES)).max(BNB_AMENITIES.length),
  houseRules: optionalText(2000),
  contactName: z.string().trim().min(2).max(100),
  contactPhone: z.string().trim().min(7).max(25).regex(/^\+?[\d\s()-]+$/, "Enter a valid phone number."),
  contactEmail: z.union([z.literal(""), z.email().max(254)]).transform((v) => v || null),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED"]),
});
export type BnbFormValues = z.infer<typeof bnbSchema>;
export type BnbFormState = { error?: string; fieldErrors?: Record<string, string[] | undefined> };
export function parseBnbForm(formData: FormData) {
  const values = Object.fromEntries(Object.keys(bnbSchema.shape).map((key) => [key, formData.get(key) ?? ""]));
  return bnbSchema.safeParse({ ...values, amenities: formData.getAll("amenities") });
}
export function canManageBnb(role: string | null | undefined) {
  return role === "ADMIN" || role === "MANAGER";
}
export function bnbPhotoUrl(image: { key: string; metadata?: unknown }) {
  const value = image.metadata as { publicUrl?: string } | null;
  return value?.publicUrl ?? (image.key.startsWith("/") || image.key.startsWith("https://") ? image.key : `/${image.key.replace(/^public\//, "")}`);
}
export function bnbMoney(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
