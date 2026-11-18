import "server-only";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupportService } from "./application/service";
import { supportRepository } from "./infrastructure/prisma-repository";
export { SupportError } from "./application/service";
export const customerSupport = createSupportService({ repository: supportRepository, allowMutation: async userId => (await checkRateLimit({ key: `customer-support:${userId}`, limit: 20, windowMs: 3600000 })).allowed });
