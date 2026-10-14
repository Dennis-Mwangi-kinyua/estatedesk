"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { UPDATE_NOTICE_ID, parseUpdateWindow } from "./policy";

export type UpdateNoticeActionState = { error?: string; message?: string };
export async function publishUpdateNotice(_state: UpdateNoticeActionState, form: FormData): Promise<UpdateNoticeActionState> {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const message = String(form.get("message") ?? "").trim();
  if (message.length < 10 || message.length > 1000) return { error: "Enter a message between 10 and 1,000 characters." };
  let window;
  try { window = parseUpdateWindow(String(form.get("startsAt") ?? ""), String(form.get("duration") ?? "")); }
  catch (error) { return { error: error instanceof Error ? error.message : "Check the update time." }; }
  const data = { message, ...window, publishedByUserId: session.userId };
  await prisma.platformUpdateNotice.upsert({ where: { id: UPDATE_NOTICE_ID }, create: { id: UPDATE_NOTICE_ID, ...data }, update: data });
  await writePlatformAuditLog({ actorUserId: session.userId, action: "PLATFORM_UPDATE_NOTICE_PUBLISHED", entityType: "PlatformUpdateNotice", entityId: UPDATE_NOTICE_ID, afterState: { message, startsAt: window.startsAt.toISOString(), endsAt: window.endsAt.toISOString() } });
  revalidatePath("/platform");
  return { message: "Update notice published. Users will see it within one minute." };
}

export async function withdrawUpdateNotice(_state: UpdateNoticeActionState, _form: FormData): Promise<UpdateNoticeActionState> {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  await prisma.platformUpdateNotice.deleteMany({ where: { id: UPDATE_NOTICE_ID } });
  await writePlatformAuditLog({ actorUserId: session.userId, action: "PLATFORM_UPDATE_NOTICE_WITHDRAWN", entityType: "PlatformUpdateNotice", entityId: UPDATE_NOTICE_ID });
  revalidatePath("/platform");
  return { message: "Update notice withdrawn." };
}
