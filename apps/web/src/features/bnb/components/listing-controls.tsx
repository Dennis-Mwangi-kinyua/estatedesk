"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { changeBnbStatusAction } from "../actions";
import type { BnbFormState } from "../validation";
export function ListingControls({ id, published }: { id: string; published: boolean }) {
  const [state, action, pending] = useActionState(changeBnbStatusAction, {} as BnbFormState);
  const [confirmArchive, setConfirmArchive] = useState(false);
  return <form action={action} className="space-y-3">
    <input type="hidden" name="id" value={id} />
    <div className="flex flex-wrap gap-2">
      <Button type="submit" variant="outline" name="status" value={published ? "PAUSED" : "PUBLISHED"} disabled={pending}>{pending ? "Updating…" : published ? "Pause listing" : "Publish listing"}</Button>
      {!confirmArchive ? <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmArchive(true)}>Archive</Button> : <><Button type="submit" variant="destructive" name="status" value="ARCHIVED" disabled={pending}>Confirm archive</Button><Button type="button" variant="ghost" onClick={() => setConfirmArchive(false)}>Cancel</Button></>}
    </div>
    {confirmArchive && <p className="text-sm text-muted-foreground">Archiving removes this listing from your workspace and public pages.</p>}
    {state.error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{state.error}</p>}
  </form>;
}
