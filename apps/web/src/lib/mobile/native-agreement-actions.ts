import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionField, NativeActionLink, NativeActionResult } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { accessibleAgreement, createAgreement, changeAgreement } from "@/lib/service-agreements/service";
import { revalidatePath } from "next/cache";
import { GET as downloadAgreement } from "@/app/api/service-agreements/[id]/route";
import { nativeSignature } from "./signature";

const field = (name: string, label: string, extra: Partial<NativeActionField> = {}): NativeActionField => ({ name, label, type: "text", ...extra });
export function nativeAgreementPageActions(kind: "organization" | "platform", path: string): NativeActionLink[] {
  return kind === "platform" && path === "/platform/agreements" ? [{ id: "agreement.create", title: "New service agreement" }] : [];
}
export function nativeAgreementRecordActions(kind: "organization" | "platform", path: string, status?: string): NativeActionLink[] {
  if (path !== (kind === "platform" ? "/platform/agreements" : "/dashboard/org/agreements")) return [];
  const actions: NativeActionLink[] = [];
  if (kind === "platform" && status === "DRAFT") actions.push({ id: "agreement.edit", title: "Revise unsigned draft" }, { id: "agreement.send", title: "Send for signature" });
  if (status === "ISSUED") actions.push({ id: "agreement.sign", title: kind === "platform" ? "Countersign agreement" : "Sign agreement" }, { id: "agreement.remind", title: "Send signature reminder" });
  if (kind === "platform" && ["DRAFT", "ISSUED"].includes(status ?? "")) actions.push({ id: "agreement.cancel", title: "Cancel agreement", destructive: true });
  if (status === "COMPLETED") actions.push({ id: "agreement.download", title: "Download completed PDF" });
  return actions;
}

export async function nativeAgreementActionDefinition(session: AppSession, kind: "organization" | "platform", path: string, id: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (path !== (kind === "platform" ? "/platform/agreements" : "/dashboard/org/agreements")) return null;
  const platform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole);
  if (kind === "platform" && !platform || kind === "organization" && platform && id === "agreement.sign") return null;
  if (id === "agreement.create" && kind === "platform" && !recordId) {
    const orgs = await prisma.organization.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } });
    return { id, title: "New service agreement", description: "Prepare the service agreement and data processing addendum. Review the parties and schedules before sending for signature.", submitLabel: "Create unsigned draft", confirmation: "Create this unsigned service agreement?", groups: [
      { id: "parties", title: "Contracting parties", fields: [
        field("orgId", "Organization", { type: "select", required: true, options: orgs.map(org => ({ value: org.id, label: org.name })) }),
        field("customer", "Customer's full legal name", { required: true, maxLength: 240 }),
        field("provider", "EstateDesk contracting legal entity", { required: true, maxLength: 240, defaultValue: "Afrisilicon Technology Limited, trading as EstateDesk" }),
        field("contact", "Privacy and incident contact email", { type: "email", required: true, maxLength: 254, defaultValue: process.env.ESTATEDESK_PRIVACY_EMAIL ?? session.email ?? "" }),
        field("representative", "EstateDesk representative", { required: true, maxLength: 160, defaultValue: session.fullName }),
      ] },
      { id: "schedules", title: "Customer-specific schedules", fields: [
        field("services", "Services, fees, term and support (at least 20 characters)", { type: "multiline", required: true, maxLength: 8000 }),
        field("infrastructure", "Subprocessors, hosting locations and safeguards (at least 20 characters)", { type: "multiline", required: true, maxLength: 8000 }),
        field("retention", "Retention and exit schedule (at least 20 characters)", { type: "multiline", required: true, maxLength: 8000 }),
      ] },
    ] };
  }
  if (!recordId) return null;
  const access = await accessibleAgreement(recordId);
  if (!access || kind === "organization" && access.document.orgId !== session.activeOrgId) return null;
  const { document, data } = access;
  if (!nativeAgreementRecordActions(kind, path, document.status).some(action => action.id === id)) return null;
  if (id === "agreement.sign" && (platform ? !data.organizationSignature || !!data.platformSignature : !!data.organizationSignature)) return null;
  if (id === "agreement.remind" && (access.reminderCooldownActive || !platform && !data.organizationSignature)) return null;
  const action = nativeAgreementRecordActions(kind, path, document.status).find(action => action.id === id)!;
  const fields: NativeActionField[] = [field("contentHash", "Reviewed document hash", { type: "hidden", required: true, defaultValue: document.contentHash ?? "" })];
  if (id === "agreement.edit") fields.push(field("body", "Complete agreement text (500–60,000 characters)", { type: "multiline", required: true, maxLength: 60000, defaultValue: data.body }));
  if (id === "agreement.cancel") fields.push(field("reason", "Cancellation reason", { type: "multiline", required: true, maxLength: 1000 }), field("confirmCancellation", "I confirm this agreement and any pending signing request should be cancelled", { type: "checkbox", required: true }));
  if (id === "agreement.sign") fields.push(field("name", "Your full account name", { required: true, defaultValue: session.fullName, maxLength: 160 }), field("signature", "Signature", { type: "signature", required: true, defaultValue: '{"signatureMethod":"TYPED"}', maxLength: 350200 }), field("consent", "I have read this agreement, agree to its terms, consent to signing electronically, and am authorized to bind the contracting party", { type: "checkbox", required: true }));
  return { id, title: action.title, description: document.title, submitLabel: action.title, destructive: action.destructive, confirmation: `${action.title}? Your action applies to the reviewed version of this agreement.`, groups: [
    ...(id === "agreement.sign" ? [{ id: "review", title: "Read the complete agreement", description: data.body, fields: [] }] : []),
    { id: "details", title: action.title, fields },
  ] };
}

export async function executeNativeAgreementAction(kind: "organization" | "platform", id: string, recordId: string | undefined, form: FormData): Promise<NativeActionResult> {
  if (id === "agreement.create" && kind === "platform") {
    await createAgreement(form);
  } else {
    if (!recordId) throw new Error("Choose an agreement.");
    if (id === "agreement.download") {
      const response = await downloadAgreement(new Request("https://estatedesk.invalid"), { params: Promise.resolve({ id: recordId }) });
      if (!response.ok) throw new Error("The completed agreement is unavailable for download.");
      const bytes = Buffer.from(await response.arrayBuffer());
      return { ok: true, message: "Completed agreement ready to save or share.", document: { filename: "service-agreement.pdf", content: bytes.toString("base64") } };
    }
    const command = id === "agreement.sign" ? kind === "platform" ? "platform-sign" : "org-sign" : id.slice("agreement.".length);
    if (!["edit", "send", "cancel", "remind", "platform-sign", "org-sign"].includes(command)) throw new Error("Unknown agreement action.");
    form.set("command", command);
    if (id === "agreement.sign") {
      const value = JSON.parse(String(form.get("signature") || '{"signatureMethod":"TYPED"}'));
      const signature = await nativeSignature(value);
      form.set("signatureMethod", signature.method);
      if (signature.method === "UPLOADED" && signature.bytes) form.set("signatureFile", new File([new Uint8Array(signature.bytes)], "signature.png", { type: "image/png" }));
      if (signature.method === "DRAWN") form.set("signatureData", signature.imageData!);
      form.delete("signature");
    }
    await changeAgreement(recordId, form);
  }
  revalidatePath("/platform/agreements", "layout");
  revalidatePath("/dashboard/org/agreements", "layout");
  revalidatePath("/dashboard/org/notifications");
  return { ok: true, message: "Service agreement updated." };
}
