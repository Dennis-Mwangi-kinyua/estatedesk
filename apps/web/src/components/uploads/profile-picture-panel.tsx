import { requireAuthenticated } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { ProfilePictureForm } from "./profile-picture-form";
export async function ProfilePicturePanel() {
  const session = await requireAuthenticated();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { profileImageUrl: true, fullName: true } });
  return <ProfilePictureForm url={user.profileImageUrl} name={user.fullName} />;
}
