import { z } from "zod";
export function normalizeNationalId(value: string) { return value.toUpperCase().replace(/[\s-]/g, ""); }
export const nationalIdSchema = z.string().trim().transform(normalizeNationalId).pipe(z.string().regex(/^[A-Z0-9]{5,30}$/, "Enter a valid ID number (5–30 letters or digits)."));
export const verificationSchema = z.object({ number: nationalIdSchema, fullName: z.string().trim().min(2).max(120), phone: z.string().trim().min(5).max(30), email: z.string().trim().max(254).refine(value => !value || z.email().safeParse(value).success, "Enter a valid email."), requestedRole: z.enum(["TENANT", "CARETAKER", "OFFICE", "MANAGER", "ACCOUNTANT", "LANDLORD"]), reason: z.string().trim().min(20).max(3000) });
export const DUPLICATE_ID_MESSAGE = "This ID number is already registered. Open Identity verification in your organisation to request platform approval and link the existing account.";
export function isDuplicateIdentityError(error: unknown) { return error instanceof Error && /ID_ALREADY_REGISTERED/.test(error.message); }
