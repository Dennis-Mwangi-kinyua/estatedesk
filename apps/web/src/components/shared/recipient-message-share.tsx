"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { WorkspaceIcon } from "./workspace-icon";
import { recipientEmailHref, recipientWhatsAppHref, type RecipientMessageDraft } from "@/lib/notifications/recipient-message";

export function RecipientMessageShare({ draft, title = "Share this update" }: { draft: RecipientMessageDraft; title?: string }) {
  const [notice, setNotice] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(draft.message); setNotice("Message copied. Review it before sending."); }
    catch { setNotice("Copy is unavailable. Select the message below or use Email or WhatsApp."); }
  }
  const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground disabled:opacity-50";
  return <section className="recipient-message-share space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
    <div><h2 className="text-base font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Review the message, then open a draft addressed to {draft.fullName}.</p></div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="min-w-0 rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Registered email</p><p className="mt-1 break-words text-sm text-foreground [overflow-wrap:anywhere]">{draft.email || "Not registered"}</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Registered phone</p><p className="mt-1 text-sm text-foreground">{draft.phone || "Not registered"}</p></div></div>
    <label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Message preview</span><textarea aria-label="Message preview" readOnly value={draft.message} rows={12} className="w-full resize-y rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6 text-foreground" /></label>
    <div className="grid gap-3 sm:grid-cols-3">
      {draft.email ? <a href={recipientEmailHref(draft)} className={button} onClick={()=>setNotice("Email draft prepared. Review it in your email app before sending.")}><WorkspaceIcon label="email" className="h-4 w-4" />Email</a> : <button disabled type="button" className={button}>No registered email</button>}
      {draft.phone ? <a href={recipientWhatsAppHref(draft)} target="_blank" rel="noopener noreferrer" className={button} onClick={()=>setNotice("WhatsApp draft prepared. Review it before sending.")}><WorkspaceIcon label="messages" className="h-4 w-4" />WhatsApp</a> : <button disabled type="button" className={button}>No registered phone</button>}
      <button type="button" className={button} onClick={copy}><Copy aria-hidden="true" className="h-4 w-4" />Copy message</button>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">These options prepare drafts. You send the message from your email or WhatsApp app.</p>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </section>;
}
