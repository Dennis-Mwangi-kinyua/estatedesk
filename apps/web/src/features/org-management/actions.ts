"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireOrgManagement } from "./access";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { safeServerActionError } from "@/lib/errors/server-error-log";
import { ManagementError, sections } from "./policy";
import { createHandover, createPromise, decideApproval, finishHandover, finishRenewal, offerRenewal, requestApproval, resolvePromise, respondRenewal, saveApprovalLimit } from "./service";
export type ManagementState = { error?: string; message?: string };
const text = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
export async function managementAction(_state: ManagementState, form: FormData): Promise<ManagementState> {
  const operation = text(form, "operation");
  const section = operation.includes("Approval") ? "approvals" : operation.includes("Promise") ? "collections" : operation.includes("Renewal") ? "renewals" : "handovers";
  const tenant = operation === "respondRenewal";
  const session = tenant ? await requireTenantAccess() : await requireOrgManagement(section);
  try {
    const input = Object.fromEntries(form);
    switch (operation) {
      case "requestApproval": await requestApproval(session, input); break;
      case "decideApproval": await decideApproval(session, text(form, "id"), text(form, "decision"), text(form, "note")); break;
      case "saveApprovalLimit": await saveApprovalLimit(session, text(form, "amount")); break;
      case "createPromise": await createPromise(session, input); break;
      case "resolvePromise": await resolvePromise(session, text(form, "id"), text(form, "status"), text(form, "note")); break;
      case "offerRenewal": await offerRenewal(session, input); break;
      case "finishRenewal": await finishRenewal(session, text(form, "id"), text(form, "decision")); break;
      case "respondRenewal": if (!canAccessWorkspacePath(session, "/dashboard/tenant/renewals")) throw new ManagementError("Lease access is required."); await respondRenewal(session, text(form, "id"), text(form, "decision"), text(form, "note")); break;
      case "createHandover": await createHandover(session, input); break;
      case "finishHandover": await finishHandover(session, text(form, "id"), text(form, "returnWork") === "yes"); break;
      default: return { error: "Unknown action. Refresh this page." };
    }
    for (const section of sections) revalidatePath(`/dashboard/org/${section}`);
    for (const path of ["/dashboard/org/leases", "/dashboard/org/payments", "/dashboard/org/expenditures", "/dashboard/org/staff", "/dashboard/org/crm", "/dashboard/org/issues", "/dashboard/tenant/renewals", "/dashboard/tenant/lease", "/dashboard/today"]) revalidatePath(path);
    return { message: operation === "requestApproval" ? "Request submitted for independent review." : operation === "offerRenewal" ? "Renewal offer sent to the tenant portal." : "Saved successfully." };
  } catch (error) {
    return { error: error instanceof ManagementError ? error.message : error instanceof ZodError ? error.issues[0].message : safeServerActionError("org-management", error, "Could not save. Refresh and try again.") };
  }
}
