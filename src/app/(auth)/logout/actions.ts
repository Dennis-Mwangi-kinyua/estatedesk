"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
  cookieStore.delete("auth_token");
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");

  redirect("/login");
}