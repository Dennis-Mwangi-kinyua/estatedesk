type RateLimitInput = {
  orgId: string;
  userId: string;
  tenantId: string;
  actionName: string;
};

type Entry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

declare global {
  // eslint-disable-next-line no-var
  var __tenantAdminRateLimitStore: Map<string, Entry> | undefined;
}

const store = global.__tenantAdminRateLimitStore ?? new Map<string, Entry>();
global.__tenantAdminRateLimitStore = store;

function getKey(input: RateLimitInput) {
  return [input.orgId, input.userId, input.tenantId, input.actionName].join(":");
}

export async function enforceTenantAdminRateLimit(input: RateLimitInput) {
  const key = getKey(input);
  const now = Date.now();
  const current = store.get(key);

  if (!current || now > current.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new Error(
      `Too many administrative requests. Please wait ${retryAfterSeconds} seconds and try again.`,
    );
  }

  current.count += 1;
  store.set(key, current);
}