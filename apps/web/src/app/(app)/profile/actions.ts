"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated } from "@/lib/permissions/guards";
import { validateImageFile } from "@/lib/uploads/secure-image";
import { uploadCloudflareImage, deleteCloudflareImage } from "@/lib/uploads/cloudflare-images";

export async function updateProfilePicture(_state: { message: string }, form: FormData) {
  const session = await requireAuthenticated();
  let newUrl: string | null = null;
  let committed = false;
  try {
    const remove = form.get("operation") === "delete";
    if (!remove) {
      const photo = form.get("photo");
      if (!(photo instanceof File) || !photo.size) throw new Error("Choose a profile picture.");
      const uploaded = await uploadCloudflareImage(await validateImageFile(photo), "profile-picture");
      if (!uploaded) throw new Error("Cloudflare Images is not configured.");
      newUrl = uploaded.publicUrl;
    }
    // A row lock serializes replacements so concurrent uploads cannot leave stale images attached.
    const oldUrl = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.userId} FOR UPDATE`;
      const user = await tx.user.findUniqueOrThrow({ where: { id: session.userId }, select: { profileImageUrl: true } });
      await tx.user.update({ where: { id: session.userId }, data: { profileImageUrl: newUrl } });
      return user.profileImageUrl;
    });
    committed = true;
    if (oldUrl) {
      try { await deleteCloudflareImage(oldUrl); } catch { console.warn("Old profile picture cleanup failed."); }
    }
    revalidatePath("/", "layout");
    return { success: true, message: remove ? "Profile picture deleted." : "Profile picture updated." };
  } catch (error) {
    if (newUrl && !committed) {
      try { await deleteCloudflareImage(newUrl); } catch { console.warn("Profile picture cleanup failed."); }
    }
    console.error("Profile picture update failed", error);
    return { success: false, message: error instanceof Error && /Choose|image|Cloudflare/.test(error.message) ? error.message : "Could not update your profile picture. Please try again." };
  }
}
