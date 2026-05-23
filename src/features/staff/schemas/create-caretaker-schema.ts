import { z } from "zod";

export const createCaretakerSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or less.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
});

export type CreateCaretakerInput = z.infer<typeof createCaretakerSchema>;