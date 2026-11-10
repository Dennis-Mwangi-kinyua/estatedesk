"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { trustedLoginIp } from "@/lib/auth/login-policy";
import { safeServerActionError } from "@/lib/errors/server-error-log";
import { requireHiringAccess, hiringBase } from "./access";
import { changeJobStatus, deleteApplication, reviewApplication, saveJob, submitApplication } from "./service";
import { RecruitmentError, applicationSchema, check } from "./policy";
export type HiringState = { error?: string; message?: string; jobId?: string };
const text = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
export async function hiringAction(_state: HiringState, form: FormData): Promise<HiringState> {
  const scope = text(form, "scope") === "platform" ? "platform" : "organization";
  const session = await requireHiringAccess(scope);
  const id = text(form, "id");
  try {
    const rate = await checkRateLimit({ key: `hiring-manage:${session.userId}`, limit: 60, windowMs: 60000 });
    check(rate.allowed, "Too many changes. Please wait a minute.");
    let jobId = id;
    switch (text(form, "operation")) {
      case "saveJob": jobId = await saveJob(session, scope, Object.fromEntries(form), id, text(form, "version")); break;
      case "changeJobStatus": await changeJobStatus(session, scope, id, text(form, "status"), text(form, "version")); break;
      case "reviewApplication": await reviewApplication(session, scope, id, text(form, "status"), text(form, "note"), text(form, "version"), text(form, "interviewAt")); jobId = text(form, "jobId"); break;
      case "deleteApplication": check(text(form, "confirmation") === "DELETE", "Type DELETE to remove the application and CV permanently."); await deleteApplication(session, scope, id, text(form, "reason")); jobId = text(form, "jobId"); break;
      default: return { error: "Unknown recruitment action." };
    }
    revalidatePath(hiringBase(scope)); revalidatePath(`${hiringBase(scope)}/${jobId}`); revalidatePath("/careers", "layout"); revalidatePath("/sitemap-careers.xml");
    return { message: text(form, "operation") === "saveJob" && !id ? "Draft created. Open it to review and publish." : "Saved successfully.", jobId };
  } catch (error) {
    return { error: error instanceof RecruitmentError ? error.message : error instanceof ZodError ? error.issues[0].message : safeServerActionError("recruitment.manage", error, "Could not save. Refresh and try again.") };
  }
}
export async function applyForJob(_state: HiringState, form: FormData): Promise<HiringState> {
  const acknowledgement = { message: "Your application has been received. The hiring team will review it and contact you using the details provided." };
  if (text(form, "website")) return acknowledgement;
  try {
    const parsed = applicationSchema.parse(Object.fromEntries(form));
    const headerStore = await headers();
    const ip = trustedLoginIp(headerStore);
    const email = createHash("sha256").update(parsed.email).digest("hex");
    const [ipLimit, emailLimit] = await Promise.all([
      checkRateLimit({ key: `recruitment-ip:${ip}`, limit: ip === "unknown" ? 100 : 10, windowMs: 3600000 }),
      checkRateLimit({ key: `recruitment-email:${email}`, limit: 5, windowMs: 3600000 }),
    ]);
    check(ipLimit.allowed && emailLimit.allowed, "Application limit reached. Please try again later.");
    const file = form.get("resume");
    let resume: { bytes: Uint8Array; fileName: string } | undefined;
    if (file instanceof File && file.size > 0) {
      check(file.size <= 1024 * 1024 && file.type === "application/pdf", "CV must be a PDF of 1MB or less.");
      resume = { bytes: new Uint8Array(await file.arrayBuffer()), fileName: file.name };
    }
    await submitApplication(text(form, "slug"), parsed, resume);
    return acknowledgement;
  } catch (error) {
    return { error: error instanceof RecruitmentError ? error.message : error instanceof ZodError ? error.issues[0].message : safeServerActionError("recruitment.apply", error, "We could not submit your application. Please try again.") };
  }
}
