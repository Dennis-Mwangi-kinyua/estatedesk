"use server";

import { clearUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await clearUserSession();
  redirect("/login");
}