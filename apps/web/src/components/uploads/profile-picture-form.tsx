"use client";
import Image from "next/image";
import { Camera, CircleCheck as CheckCircle2, ImagePlus, LoaderCircle, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfilePicture } from "@/app/(app)/profile/actions";

export function ProfilePictureForm({ url, name = "Your profile" }: { url: string | null; name?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  function clearSelection() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null; setPreview(null); setFileName("");
    if (input.current) input.current.value = "";
  }
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
  const [state, action, pending] = useActionState(async (previous: { message: string; success?: boolean }, form: FormData) => {
    const result = await updateProfilePicture(previous, form);
    if (result.success) { clearSelection(); router.refresh(); }
    return result;
  }, { message: "", success: false });
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
    <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6"><h2 className="font-semibold">Profile picture</h2><p className="mt-1 text-sm text-muted-foreground">Make your account easy to recognize. Your picture appears when you sign in.</p></div>
    <form action={action} className="p-5 sm:p-6" aria-busy={pending}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-3xl font-semibold text-primary ring-4 ring-background shadow-sm">
            {preview || url ? <Image src={preview || url!} alt={preview ? "Preview of your new profile picture" : `${name}'s profile picture`} width={112} height={112} unoptimized={!!preview} className="h-28 w-28 object-cover" /> : initials || <Camera className="h-9 w-9" />}
          </div>
          <span aria-hidden="true" className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground"><Camera className="h-4 w-4" /></span>
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <p className="font-medium">{name}</p>
          <label className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted focus-within:ring-2 focus-within:ring-primary ${pending ? "pointer-events-none opacity-50" : ""}`}>
            <ImagePlus className="h-4 w-4" />{url ? "Choose a new photo" : "Choose a photo"}
            <input ref={input} name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} className="sr-only" onChange={event => {
              const file = event.target.files?.[0]; setError("");
              if (!file) { clearSelection(); return; }
              if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
                clearSelection(); setError("Choose a JPG, PNG, or WebP image up to 5MB."); return;
              }
              if (previewRef.current) URL.revokeObjectURL(previewRef.current);
              const next = URL.createObjectURL(file); previewRef.current = next; setPreview(next); setFileName(file.name);
            }} />
          </label>
          <p className="text-xs leading-5 text-muted-foreground">JPG, PNG, or WebP · Up to 5MB<br />A clear, centered photo works best.</p>
          {preview ? <div className="flex items-center justify-center gap-2 sm:justify-start"><p className="max-w-56 ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-xs text-muted-foreground">{fileName}</p><button data-workspace-action="true" type="button" onClick={clearSelection} disabled={pending} aria-label="Discard selected photo" className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button></div> : null}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button data-workspace-action="true" name="operation" value="upload" disabled={pending || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 className="h-4 w-4" />}{pending ? "Saving…" : "Save picture"}</button>
        {url ? <button data-workspace-action="true" name="operation" value="delete" data-confirm="Delete your profile picture? You can upload a new one at any time." disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"><Trash2 className="h-4 w-4" />Delete picture</button> : null}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      {state.message ? <p role={state.success ? "status" : "alert"} className={`mt-3 text-sm ${state.success ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}>{state.message}</p> : null}
    </form>
  </section>;
}
