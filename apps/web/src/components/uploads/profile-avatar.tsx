"use client";
import Image from "next/image";
import { useProfilePicture } from "./profile-picture-context";
export function ProfileAvatar({ name }: { name: string }) {
  const picture = useProfilePicture();
  const initials = name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
  return picture ? <Image src={picture} alt={`${name}'s profile picture`} width={64} height={64} className="h-full w-full rounded-[inherit] object-cover" /> : <>{initials || "?"}</>;
}
