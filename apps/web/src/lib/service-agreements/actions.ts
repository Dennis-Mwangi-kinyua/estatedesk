"use server";
import { unstable_rethrow, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAgreement, changeAgreement } from "./service";
export async function createAgreementAction(form: FormData) {
  let id: string;
  try { id = (await createAgreement(form)).id; }
  catch (error) { unstable_rethrow(error); redirect("/platform/agreements/new?error=creation"); }
  revalidatePath("/platform/agreements");
  redirect(`/platform/agreements/${id}`);
}
export async function changeAgreementAction(id: string, form: FormData) {
  let failed = false;
  try { await changeAgreement(id, form); } catch (error) { unstable_rethrow(error); failed = true; }
  const platform = String(form.get("command")) !== "org-sign";
  const base = platform ? "/platform/agreements" : "/dashboard/org/agreements";
  if (failed) redirect(`${base}/${id}?error=action`);
  revalidatePath("/platform/agreements", "layout");
  revalidatePath("/dashboard/org/agreements", "layout");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/org/settings", "layout");
  redirect(`${base}/${id}?ok=saved`);
}
