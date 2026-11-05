"use server";

import { expirePublicVacancies } from "@/lib/public-vacancy-cache";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithDeleteError(slug: string, message: string): never {
  redirect(
    `/platform/organizations/${encodeURIComponent(slug)}?deleteError=${encodeURIComponent(message)}`,
  );
}

function redirectWithArchiveError(slug: string, message: string): never {
  redirect(
    `/platform/organizations/${encodeURIComponent(slug)}?archiveError=${encodeURIComponent(message)}`,
  );
}

export async function archiveOrganizationAction(formData: FormData) {
  return changeOrganizationStatus(formData, "DISABLED");
}

export async function reactivateOrganizationAction(formData: FormData) {
  return changeOrganizationStatus(formData, "ACTIVE");
}

async function changeOrganizationStatus(formData: FormData, status: "ACTIVE" | "DISABLED") {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const orgId = formText(formData, "orgId");
  const expectedSlug = formText(formData, "expectedSlug");
  const confirmation = formText(formData, "archiveConfirmation");

  if (!orgId || !expectedSlug) {
    redirect("/platform/organizations");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, slug: true, status: true },
  });

  if (!org) {
    redirect("/platform/organizations");
  }

  if (expectedSlug !== org.slug || confirmation !== org.slug) {
    redirectWithArchiveError(org.slug, `Type ${org.slug} to ${status === "ACTIVE" ? "reactivate" : "deactivate"} this organization.`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: org.id },
        data: { status },
      });

      if (status !== "ACTIVE") await tx.userSession.updateMany({
        where: {
          activeMembership: {
            orgId: org.id,
          },
        },
        data: {
          activeMembershipId: null,
        },
      });
    });
  } catch (error) {
    console.error("Organization status change failed", { orgId: org.id, error });
    redirectWithArchiveError(org.slug, "Unable to change organization status. Please retry.");
  }

  expirePublicVacancies();
  revalidatePath("/dashboard", "layout");
  revalidatePath("/platform");
  revalidatePath("/platform/organizations");
  revalidatePath(`/platform/organizations/${org.slug}`);
  redirect(`/platform/organizations/${encodeURIComponent(org.slug)}`);
}

export async function permanentlyDeleteOrganizationAction(formData: FormData) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const orgId = formText(formData, "orgId");
  const expectedSlug = formText(formData, "expectedSlug");
  const confirmation = formText(formData, "confirmation");

  if (!orgId || !expectedSlug) {
    redirect("/platform/organizations");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, slug: true },
  });

  if (!org) {
    redirect("/platform/organizations");
  }

  if (expectedSlug !== org.slug || confirmation !== org.slug) {
    redirectWithDeleteError(org.slug, `Type ${org.slug} to permanently delete this organization.`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userSession.updateMany({
        where: {
          activeMembership: {
            orgId: org.id,
          },
        },
        data: {
          activeMembershipId: null,
        },
      });

      await tx.organization.delete({
        where: { id: org.id },
      });
    });
  } catch (error) {
    console.error("Permanent organization deletion failed", { orgId: org.id, error });
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    redirectWithDeleteError(org.slug, code === "P2003"
      ? "Deletion was blocked by a linked record. No organization data was deleted. Review the server log for the affected relation."
      : "Unable to delete this organization. No organization data was deleted. Please retry.");
  }

  expirePublicVacancies();
  revalidatePath("/dashboard", "layout");
  revalidatePath("/platform");
  revalidatePath("/platform/organizations");
  revalidatePath("/platform/data-management");
  redirect(`/platform/organizations?deleted=${encodeURIComponent(org.slug)}`);
}
