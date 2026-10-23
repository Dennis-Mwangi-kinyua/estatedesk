import "server-only";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
export async function requireProvider(active = false) {
  const session = await requireUserSession();
  const provider = await prisma.serviceProvider.findUnique({ where: { userId: session.userId } });
  if (!provider) redirect("/service-providers/register");
  if (session.mustChangePassword || session.requiresTermsAcceptance) redirect("/change-password");
  if (["PENDING", "CHANGES_REQUESTED", "REJECTED"].includes(provider.status)) redirect("/provider/pending");
  if (["SUSPENDED", "DELETED"].includes(provider.status)) redirect("/account-suspended");
  if (active && provider.status !== "ACTIVE") throw new Error("Your profile is under review. New applications are paused.");
  return { session, provider };
}
