import { z } from "zod";
export const ticketSchema = z.object({ subject: z.string().trim().min(3).max(160), category: z.enum(["ACCOUNT", "BILLING", "TECHNICAL", "OTHER"]), body: z.string().trim().min(10).max(4000) });
export const replySchema = z.object({ ticketId: z.string().min(1).max(100), body: z.string().trim().min(1).max(4000) });
export const isSupportAgent = (role: string) => ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(role);
export const supportTicketWhere = (userId: string, platformRole: string) => isSupportAgent(platformRole) ? {} : { ownerId: userId };
