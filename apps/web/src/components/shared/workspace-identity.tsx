"use client";
import Image from "next/image";
import Link from "next/link";
import { useProfilePicture } from "@/components/uploads/profile-picture-context";
export function WorkspaceIdentity({ name, role }: { name: string; role: string }) {
  const picture = useProfilePicture();
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
  return <Link href="/profile" aria-label="My profile" className="workspace-identity flex"><span aria-hidden="true" className="workspace-identity__avatar">{picture ? <Image src={picture} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : initials}</span><div className="min-w-0 hidden sm:block"><p className="ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-xs font-semibold text-foreground">{name}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{role}</p></div></Link>;
}
