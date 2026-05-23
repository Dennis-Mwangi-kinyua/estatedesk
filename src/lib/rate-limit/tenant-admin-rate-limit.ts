import "server-only";

import { checkRateLimit } from "@/lib/rate-limit";

type RateLimitInput = {
  orgId: string;
  userId: string;
  tenantId: string;
  actionName: string;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

function getKey(input: RateLimitInput) {
  return [
    "tenant-admin",
    input.orgId,
    input.userId,
    input.tenantId,
    input.actionName,
  ].join(":");
}

export async function enforceTenantAdminRateLimit(input: RateLimitInput) {
  const limiter = await checkRateLimit({
    key: getKey(input),
    limit: MAX_REQUESTS,
    windowMs: WINDOW_MS,
  });

  if (!limiter.allowed) {
    throw new Error(
      `Too many administrative requests. Please wait ${limiter.retryAfterSeconds} seconds and try again.`,
    );
  }
}
