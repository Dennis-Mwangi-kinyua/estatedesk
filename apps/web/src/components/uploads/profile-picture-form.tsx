"use client";
import Image from "next/image";
import { useActionState } from "react";
import { updateProfilePicture } from "@/app/(app)/profile/actions";
export function ProfilePictureForm({ url }: { url: string | null }) {
  const [state, action, pending] = useActionState(updateProfilePicture, { message: "" });
  return <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
    <h2 className="font-semibold">Profile picture</h2>
    {url ? <Image src={url} alt="Your profile picture" width={96} height={96} className="h-24 w-24 rounded-full object-cover" /> : <p className="text-sm text-muted-foreground">No profile picture yet.</p>}
    <form action={action} className="space-y-3">
      <label className="block text-sm">Choose JPG, PNG, or WebP (up to 5MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} className="mt-2 block w-full" /></label>
      <div className="flex gap-3"><button name="operation" value="upload" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">{pending ? "Saving…" : url ? "Replace picture" : "Upload picture"}</button>
      {url ? <button name="operation" value="delete" disabled={pending} className="rounded-lg border px-4 py-2">Delete picture</button> : null}</div>
    </form>
    <p role="status" className="text-sm">{state.message}</p>
  </section>;
}
