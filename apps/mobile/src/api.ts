import { mobileProfileSchema, type MobileProfileInput, mobileCommunitySchema, mobileExpendituresSchema, type MobileExpenditureInput } from "@estatedesk/contracts/mobile";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { clearDrafts } from "./drafts";
import { attachmentForm, clearEvidenceCache, type Photo } from "./photos";
import { tenantDocumentPath, mobileDocumentsSchema, mobilePaymentReviewSchema, mobileInspectionsSchema, mobileVisitorsSchema, mobileVisitorResultSchema, type MobileVisitorInput } from "@estatedesk/contracts/mobile";
import * as SecureStore from "expo-secure-store";
import { createRequestCoalescer } from "./request-coalescer";
import {
  mobileWorkspaceDashboardSchema, type MobileWorkspaceKind,
  mobileBillsSchema,
  mobileLoginResponseSchema,
  mobileSessionSchema,
  mobileMembershipsSchema, mobileIssuesSchema, mobileMetersSchema, mobilePaymentMethodsSchema, mobileNotificationsSchema,
  type MobilePaymentInput,
  mobilePaymentHistorySchema,
  mobileLeasesSchema, mobileMoveOutsSchema, mobileWorkOrdersSchema, mobilePortfolioSchema,
  type MobileWorkOrderInput,
} from "@estatedesk/contracts/mobile";

const PROFILE_KEY = "estatedesk.profile";
const SESSION_KEY = "estatedesk.session";
const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
const reads = createRequestCoalescer();

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

async function request(path: string, options: { method?: string; body?: unknown; form?: FormData; anonymous?: boolean } = {}) {
  const origin = baseUrl();
  const cookie = options.anonymous ? null : await SecureStore.getItemAsync(SESSION_KEY);
  const send = () => sendRequest(origin, cookie, path, options);
  if (!options.method || options.method === "GET") return reads.run(`${cookie ?? "anonymous"}\0${path}`, send);
  // Any mutation may change the organization, identity, or the records shown.
  reads.clear();
  return send().finally(() => reads.clear());
}

async function sendRequest(origin: string, cookie: string | null, path: string, options: { method?: string; body?: unknown; form?: FormData; anonymous?: boolean }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`${origin}/api/mobile${path}`, {
      method: options.method ?? "GET",
      // Native cookie jars must not silently reuse a different account.
      credentials: "omit",
      headers: {
        Accept: "application/json",
        ...(options.form ? {} : { "Content-Type": "application/json" }),
        "X-EstateDesk-Client": "native",
        "X-EstateDesk-Capabilities": "2026-10-18",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: options.form ?? (options.body ? JSON.stringify(options.body) : undefined),
      signal: controller.signal,
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const message = typeof body === "object" && body && "error" in body && typeof body.error === "string"
        ? body.error : "The request could not be completed.";
      if (response.status === 401 && !options.anonymous) {
        reads.clear();
        await clearDrafts(); await clearDocumentCache(); await SecureStore.deleteItemAsync(PROFILE_KEY); await SecureStore.deleteItemAsync(SESSION_KEY);
      }
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
  await clearDrafts(); await clearDocumentCache(); await SecureStore.deleteItemAsync(PROFILE_KEY);
  await SecureStore.setItemAsync(SESSION_KEY, result.sessionCookie, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function hasSavedSession() {
  return Boolean(await SecureStore.getItemAsync(SESSION_KEY));
}
export async function getSession() {
  const session = mobileSessionSchema.parse(await request("/session"));
  // A fresh session may reflect an organization change made in the web view.
  reads.clear();
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(session), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  return session;
}
export async function getCachedSession() {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  let cached: unknown;
  try { cached = raw ? JSON.parse(raw) : null; } catch { return null; }
  const result = mobileSessionSchema.safeParse(cached);
  return result?.success && result.data.userId && !result.data.requiresAccountSetup ? result.data : null;
}
export async function getBills() { return mobileBillsSchema.parse(await request("/tenant/bills")); }
export async function getWorkspaceDashboard(kind: MobileWorkspaceKind, section = "summary") {
  return mobileWorkspaceDashboardSchema.parse(await request(`/workspace?kind=${kind}&section=${section}`));
}
export async function getMemberships() { return mobileMembershipsSchema.parse(await request("/memberships")); }
export async function switchMembership(membershipId: string) {
  const result = await request("/memberships", { method: "POST", body: { membershipId } });
  await clearDocumentCache(); await SecureStore.deleteItemAsync(PROFILE_KEY);
  return result;
}
export async function completeSetup(body: { currentPassword: string; newPassword: string; confirmPassword: string; acceptedTerms: true }) { return request("/account/setup", { method: "POST", body }); }
export async function getIssues() { return mobileIssuesSchema.parse(await request("/tenant/issues")); }
export async function submitIssue(body: { unitId: string; title: string; description: string; priority: string }, photo?: Photo | null) { return request("/tenant/issues", { method: "POST", form: attachmentForm(body, photo ? { photo } : {}) }); }
export async function getMeters() { return mobileMetersSchema.parse(await request("/caretaker/meters")); }
export async function submitReading(body: object, photos: Record<string, Photo> = {}, clientId?: string) { return request("/caretaker/meters", { method: "POST", form: attachmentForm(body, photos, clientId) }); }
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
export async function updateWorkOrder(body: MobileWorkOrderInput, photo?: Photo | null) { return request("/caretaker/issues", { method: "POST", form: attachmentForm(body, photo ? { photo } : {}) }); }
export async function getPortfolio(q = "", status = "ALL", page = 1) {
  const query = new URLSearchParams({ q, status, page: String(page) });
  return mobilePortfolioSchema.parse(await request(`/org/units?${query}`));
}

export async function signOut() {
  // Retain credentials if revocation fails so the user can retry. Do not claim
  // a server session was revoked while the device is offline.
  await request("/logout", { method: "POST" });
  await clearDrafts();
  await clearDocumentCache();
  await SecureStore.deleteItemAsync(PROFILE_KEY);
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export function websiteUrl() { return baseUrl(); }

// Only hand credentials to the fixed backend bootstrap, never a navigated URL.
export async function tenantWorkspaceSource(path: string) {
  const cookie = await SecureStore.getItemAsync(SESSION_KEY);
  if (!cookie) throw new ApiError("Please sign in again.", 401);
  return { uri: `${baseUrl()}/api/mobile/tenant/portal?path=${encodeURIComponent(path)}`,
    headers: { Cookie: cookie, "X-EstateDesk-Client": "native" } };
}
export async function workspaceSource(kind: MobileWorkspaceKind, path: string) {
  const cookie = await SecureStore.getItemAsync(SESSION_KEY);
  if (!cookie) throw new ApiError("Please sign in again.", 401);
  return { uri: `${baseUrl()}/api/mobile/workspace/portal?kind=${kind}&path=${encodeURIComponent(path)}`,
    headers: { Cookie: cookie, "X-EstateDesk-Client": "native" } };
}

export async function getDocuments() { return mobileDocumentsSchema.parse(await request("/tenant/documents")); }
export async function getReviewPayments(page = 1) { return mobilePaymentReviewSchema.parse(await request(`/org/payments?page=${page}`)); }
export async function reviewPayment(id: string, action: "verify" | "reject", note: string) { return request("/org/payments", { method: "POST", body: { id, action, note } }); }
export async function getInspections() { return mobileInspectionsSchema.parse(await request("/caretaker/inspections")); }
export async function submitInspection(body: object, photos: Record<string, Photo> = {}, clientId?: string) { return request("/caretaker/inspections", { method: "POST", form: attachmentForm(body, photos, clientId) }); }
export async function getVisitors() { return mobileVisitorsSchema.parse(await request("/tenant/visitors")); }
export async function visitorAction(body: MobileVisitorInput) {
  return mobileVisitorResultSchema.parse(await request(body.action === "verify" || body.action === "admit" ? "/gate/visitors" : "/tenant/visitors", { method: "POST", body }));
}
const documentsDirectory = () => new Directory(Paths.cache, "estatedesk-documents");
export async function clearDocumentCache() { const dir = documentsDirectory(); if (dir.exists) dir.delete(); clearEvidenceCache(); }
export async function openDocument(kind: "receipt" | "lease", id: string, share: boolean) {
  return downloadPdf(`/api/mobile/tenant/documents/${kind}/${encodeURIComponent(id)}`, `${kind}-${id.replace(/[^a-zA-Z0-9-]/g, "")}`, share);
}
export async function openTenantWebDocument(url: string) {
  const path = tenantDocumentPath(url, baseUrl());
  if (!path) throw new Error("This document link is unavailable.");
  return downloadPdf(path, "tenant-document", true);
}
async function downloadPdf(path: string, filename: string, share: boolean) {
  const cookie = await SecureStore.getItemAsync(SESSION_KEY);
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, { credentials: "omit", redirect: "error", headers: { "X-EstateDesk-Client": "native", ...(cookie ? { Cookie: cookie } : {}) }, signal: controller.signal });
    if (!response.ok) {
      if (response.status === 401) { await clearDrafts(); await clearDocumentCache(); await SecureStore.deleteItemAsync(PROFILE_KEY); await SecureStore.deleteItemAsync(SESSION_KEY); }
      throw new ApiError("Unable to download this document. Refresh and try again.", response.status);
    }
    if (!response.headers.get("content-type")?.includes("application/pdf")) throw new Error("The server did not return a PDF.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 25 * 1024 * 1024 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") throw new Error("Invalid document.");
    documentsDirectory().create({ intermediates: true, idempotent: true });
    const file = new File(documentsDirectory(), `${filename}.pdf`);
    file.write(bytes);
    if (share) { if (!await Sharing.isAvailableAsync()) throw new Error("File sharing is unavailable on this device."); await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" }); }
    else { if (!await file.canPreview({ mimeType: "application/pdf" })) throw new Error("No PDF viewer is installed. Use Share PDF to save or open it."); await file.preview({ mimeType: "application/pdf" }); }
  } finally { clearTimeout(timeout); }
}

export async function getCommunity() { return mobileCommunitySchema.parse(await request("/tenant/community")); }
export async function readCommunity(id: string) { return request("/tenant/community", { method: "POST", body: { id } }); }
export async function getExpenditures(page = 1) { return mobileExpendituresSchema.parse(await request(`/tenant/expenditures?page=${page}`)); }
export async function createExpenditure(body: MobileExpenditureInput) { return request("/tenant/expenditures", { method: "POST", body }); }
export async function getProfile() { return mobileProfileSchema.parse(await request("/tenant/profile")); }
export async function updateProfile(body: MobileProfileInput) { return request("/tenant/profile", { method: "POST", body }); }
