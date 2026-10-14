import { z } from "zod";
export const visitorSchema = z.object({
  visitorName: z.string().trim().min(2).max(120),
  visitorPhone: z.string().trim().max(25).regex(/^[+\d ()-]*$/),
  vehiclePlate: z.string().trim().max(25),
  validFrom: z.iso.datetime({ offset: true }),
  validUntil: z.iso.datetime({ offset: true }),
}).superRefine((value, ctx) => {
  const duration = Date.parse(value.validUntil) - Date.parse(value.validFrom);
  if (duration <= 0 || duration > 24 * 3600000) ctx.addIssue({ code: "custom", path: ["validUntil"], message: "A visitor pass must last between one minute and 24 hours." });
});
export function visitorPassState(pass: { revokedAt: Date | null; admittedAt: Date | null; validFrom: Date; validUntil: Date }, now = new Date()) {
  if (pass.revokedAt) return "REVOKED";
  if (pass.admittedAt) return "ADMITTED";
  if (now < pass.validFrom) return "UPCOMING";
  if (now >= pass.validUntil) return "EXPIRED";
  return "READY";
}
