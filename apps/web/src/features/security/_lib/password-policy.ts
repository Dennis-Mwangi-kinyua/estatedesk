import { z } from "zod";

export const accountPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(1024),
  newPassword: z.string().min(12, "Use at least 12 characters for your new password.").max(72, "Use no more than 72 bytes for your new password."),
  confirmPassword: z.string().min(1, "Confirm your new password.").max(72),
}).refine(value => value.newPassword === value.confirmPassword, { message: "New passwords do not match.", path: ["confirmPassword"] });
