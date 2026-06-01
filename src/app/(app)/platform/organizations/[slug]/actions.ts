"use server";

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

  if (confirmation !== org.slug) {
    redirectWithArchiveError(org.slug, `Type ${org.slug} to archive this organization.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: org.id },
      data: { status: "DISABLED" },
    });

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
  });

  revalidatePath("/platform");
  revalidatePath("/platform/organizations");
  revalidatePath(`/platform/organizations/${org.slug}`);
  redirect(`/platform/organizations?archived=${encodeURIComponent(org.slug)}`);
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

  if (confirmation !== org.slug) {
    redirectWithDeleteError(org.slug, `Type ${org.slug} to permanently delete this organization.`);
  }

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

  revalidatePath("/platform");
  revalidatePath("/platform/organizations");
  revalidatePath("/platform/data-management");
  redirect(`/platform/organizations?deleted=${encodeURIComponent(org.slug)}`);
}
