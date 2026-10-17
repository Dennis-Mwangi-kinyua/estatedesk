import * as SecureStore from "expo-secure-store";
import {
  mobileBillsSchema,
  mobileLoginResponseSchema,
  mobileSessionSchema,
  mobileMembershipsSchema, mobileIssuesSchema, mobileMetersSchema, mobilePaymentMethodsSchema, mobileNotificationsSchema,
  type MobilePaymentInput,
  mobilePaymentHistorySchema,
  mobileLeasesSchema, mobileMoveOutsSchema, mobileWorkOrdersSchema, mobilePortfolioSchema,
  type MobileWorkOrderInput,
} from "@estatedesk/contracts/mobile";

const SESSION_KEY = "estatedesk.session";
const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

function baseUrl() {
  if (!configuredUrl) throw new Error("Set EXPO_PUBLIC_API_URL before starting the app.");
  const url = new URL(configuredUrl);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("EXPO_PUBLIC_API_URL must be a server origin without a path or credentials.");
  }
  if (url.protocol !== "https:" && !(__DEV__ && url.protocol === "http:")) {
    throw new Error("The app requires an HTTPS server.");
  }
  return url.origin;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request(path: string, options: { method?: string; body?: unknown; anonymous?: boolean } = {}) {
  const origin = baseUrl();
  const cookie = options.anonymous ? null : await SecureStore.getItemAsync(SESSION_KEY);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`${origin}/api/mobile${path}`, {
      method: options.method ?? "GET",
      // Native cookie jars must not silently reuse a different account.
      credentials: "omit",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-EstateDesk-Client": "native",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const message = typeof body === "object" && body && "error" in body && typeof body.error === "string"
        ? body.error : "The request could not be completed.";
      if (response.status === 401 && !options.anonymous) await SecureStore.deleteItemAsync(SESSION_KEY);
      throw new ApiError(message, response.status);
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error("Unable to reach EstateDesk. Check your connection and try again.");
  } finally { clearTimeout(timeout); }
}

export async function signIn(email: string, password: string) {
  const result = mobileLoginResponseSchema.parse(await request("/login", {
    method: "POST", body: { email, password }, anonymous: true,
  }));
  await SecureStore.setItemAsync(SESSION_KEY, result.sessionCookie, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function hasSavedSession() {
  return Boolean(await SecureStore.getItemAsync(SESSION_KEY));
}
export async function getSession() { return mobileSessionSchema.parse(await request("/session")); }
export async function getBills() { return mobileBillsSchema.parse(await request("/tenant/bills")); }
export async function getMemberships() { return mobileMembershipsSchema.parse(await request("/memberships")); }
export async function switchMembership(membershipId: string) { return request("/memberships", { method: "POST", body: { membershipId } }); }
export async function completeSetup(body: { currentPassword: string; newPassword: string; confirmPassword: string; acceptedTerms: true }) { return request("/account/setup", { method: "POST", body }); }
export async function getIssues() { return mobileIssuesSchema.parse(await request("/tenant/issues")); }
export async function submitIssue(body: { unitId: string; title: string; description: string; priority: string }) { return request("/tenant/issues", { method: "POST", body }); }
export async function getMeters() { return mobileMetersSchema.parse(await request("/caretaker/meters")); }
export async function submitReading(body: { unitId: string; period: string; currentReading: number; notes: string }) { return request("/caretaker/meters", { method: "POST", body }); }
export async function getPaymentMethods() { return mobilePaymentMethodsSchema.parse(await request("/tenant/payments")); }
export async function getPaymentHistory() { return mobilePaymentHistorySchema.parse(await request("/tenant/payments/history")); }
export async function submitPayment(body: MobilePaymentInput) { return request("/tenant/payments", { method: "POST", body }); }
export async function getNotifications() { return mobileNotificationsSchema.parse(await request("/notifications")); }
export async function readNotification(id: string) { return request("/notifications", { method: "POST", body: { id } }); }
export async function registerPush(token: string, platform: "ios" | "android") { return request("/push", { method: "POST", body: { token, platform } }); }
export async function disablePush() { return request("/push", { method: "DELETE" }); }
export async function getLeases() { return mobileLeasesSchema.parse(await request("/tenant/leases")); }
export async function getMoveOuts() { return mobileMoveOutsSchema.parse(await request("/tenant/move-outs")); }
export async function getWorkOrders() { return mobileWorkOrdersSchema.parse(await request("/caretaker/issues")); }
export async function updateWorkOrder(body: MobileWorkOrderInput) { return request("/caretaker/issues", { method: "POST", body }); }
export async function getPortfolio(q = "", status = "ALL", page = 1) {
  const query = new URLSearchParams({ q, status, page: String(page) });
  return mobilePortfolioSchema.parse(await request(`/org/units?${query}`));
}

export async function signOut() {
  // Retain credentials if revocation fails so the user can retry. Do not claim
  // a server session was revoked while the device is offline.
  await request("/logout", { method: "POST" });
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export function websiteUrl() { return baseUrl(); }
