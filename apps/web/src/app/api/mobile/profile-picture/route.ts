import { prisma } from "@/lib/prisma";
import { nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { validateImageFile, type ValidatedImage } from "@/lib/uploads/secure-image";
import { deleteCloudflareImage, uploadCloudflareImage } from "@/lib/uploads/cloudflare-images";

async function replaceProfileImage(userId: string, profileImageUrl: string | null) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { profileImageUrl: true } });
    await tx.user.update({ where: { id: userId }, data: { profileImageUrl } });
    return user.profileImageUrl;
  });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 5_300_000) return mobileJson({ error: "Choose an image under 5MB." }, 413);
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File) || !photo.size) return mobileJson({ error: "Choose a profile picture." }, 400);
    let image: ValidatedImage;
    try { image = await validateImageFile(photo, { maxBytes: 5 * 1024 * 1024 }); }
    catch (error) { return mobileJson({ error: error instanceof Error ? error.message : "Choose a valid image." }, 400); }
    const uploaded = await uploadCloudflareImage(image, "profile-picture");
    if (!uploaded) return mobileJson({ error: "Profile photo storage is not configured." }, 503);
    let committed = false;
    try {
      const previousUrl = await replaceProfileImage(session.userId, uploaded.publicUrl);
      committed = true;
      if (previousUrl) {
        try { await deleteCloudflareImage(previousUrl); } catch { console.warn("Old profile picture cleanup failed."); }
      }
      return mobileJson({ profileImageUrl: uploaded.publicUrl });
    } finally {
      if (!committed) {
        try { await deleteCloudflareImage(uploaded.publicUrl); } catch { console.warn("Profile picture cleanup failed."); }
      }
    }
  });
}

export async function DELETE(request: Request) {
  return nativeRoute(request, async session => {
    const previousUrl = await replaceProfileImage(session.userId, null);
    if (previousUrl) {
      try { await deleteCloudflareImage(previousUrl); } catch { console.warn("Old profile picture cleanup failed."); }
    }
    return mobileJson({ profileImageUrl: null });
  });
}
