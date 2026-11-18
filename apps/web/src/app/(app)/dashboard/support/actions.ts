"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserSession } from "@/lib/auth/session";
import { customerSupport, SupportError } from "@/features/customer-support";
export type SupportState = { error?: string };
const failure = (error: unknown): SupportState => ({ error: error instanceof SupportError ? error.message : "Your request could not be saved. Please try again." });
export async function createTicket(_previous: SupportState, form: FormData): Promise<SupportState> {
  const session = await requireUserSession();
  let id: string;
  try { id = await customerSupport.create(session, Object.fromEntries(form)); }
  catch (error) { return failure(error); }
  redirect(`/dashboard/support/${id}`);
}
export async function replyTicket(_previous: SupportState, form: FormData): Promise<SupportState> {
  const session = await requireUserSession();
  try { await customerSupport.reply(session, Object.fromEntries(form)); }
  catch (error) { return failure(error); }
  revalidatePath(`/dashboard/support/${String(form.get("ticketId"))}`);
  return {};
}
export async function resolveTicket(form: FormData) {
  const session = await requireUserSession();
  const id = String(form.get("ticketId") ?? "");
  await customerSupport.resolve(session, id);
  revalidatePath(`/dashboard/support/${id}`);
}
