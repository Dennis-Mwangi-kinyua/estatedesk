"use client";

import Link from "@/components/navigation/workspace-link";
import { useEffect, useRef, useState } from "react";
import { Archive, ArrowLeft, ArrowUpRight, Ban, CheckCheck, Inbox, Mail, Phone, RotateCcw, Trash2 } from "lucide-react";
import {
  closePlatformMessageAction,
  deletePlatformMessageAction,
  markPlatformMessageReadAction,
  markPlatformMessageSpamAction,
  reopenPlatformMessageAction,
} from "../actions";
import { MessageActionButton } from "./message-action-button";

export type InboxMessage = {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  org: { name: string; slug: string };
  sender: { fullName: string; email: string | null; phone: string | null };
};

export const messageStatusLabels: Record<string, string> = {
  OPEN: "Unread",
  READ: "Read",
  CLOSED: "Closed",
  SPAM: "Spam",
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
}

export function MessagesInbox({ messages, filtered }: { messages: InboxMessage[]; filtered: boolean }) {
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? "");
  const [mobileReading, setMobileReading] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = messages.find(message => message.id === selectedId) ?? messages[0];
  const date = new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  });
  const shortDate = new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    timeZone: "Africa/Nairobi",
  });

  useEffect(() => {
    if (mobileReading) headingRef.current?.focus({ preventScroll: true });
  }, [selected?.id, mobileReading]);

  if (!messages.length) {
    return (
      <section className="rounded-2xl border border-border bg-card px-5 py-14 text-center">
        <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Inbox className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {filtered ? "No messages in this view" : "Your inbox is clear"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {filtered
            ? "Try another queue or clear your search to find a message."
            : "Messages from organisation workspaces will appear here."}
        </p>
        {filtered && (
          <Link href="/platform/messages" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted">
            View all messages
          </Link>
        )}
      </section>
    );
  }

  return (
    <section
      className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm lg:min-h-[570px] lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]"
      aria-label="Support inbox"
    >
      <div className={`${mobileReading ? "hidden lg:block" : "block"} min-w-0 border-border lg:border-r`}>
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Messages</h2>
          <span className="rounded-md bg-background px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
            {messages.length} on this page
          </span>
        </div>
        <div ref={listRef} className="max-h-[640px] overflow-y-auto" role="group" aria-label="Choose a message">
          {messages.map(message => {
            const active = selected?.id === message.id;
            return (
              <button
                data-workspace-action="true"
                key={message.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedId(message.id);
                  setMobileReading(true);
                }}
                className={`group relative block w-full border-b border-border px-4 py-4 text-left transition last:border-b-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary ${active ? "bg-primary/5" : "hover:bg-muted/40"}`}
              >
                {active && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-primary" />}
                <div className="flex min-w-0 items-start gap-3">
                  <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                    {initials(message.org.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="ed-full-name min-w-0 break-words text-xs font-medium text-muted-foreground">{message.org.name}</p>
                      <time dateTime={message.createdAt} className="shrink-0 text-[11px] text-muted-foreground">
                        {shortDate.format(new Date(message.createdAt))}
                      </time>
                    </div>
                    <p className={`mt-1 truncate text-sm text-foreground ${message.status === "OPEN" ? "font-semibold" : "font-medium"}`}>
                      {message.subject}
                    </p>
                    <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">{message.message}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {message.status === "OPEN" && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      {messageStatusLabels[message.status] ?? message.status}<span aria-hidden="true">·</span>{message.sender.fullName}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <article
          key={selected.id}
          className={`${mobileReading ? "block" : "hidden lg:block"} min-w-0`}
          aria-labelledby="message-subject"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:px-6">
            <button
              data-workspace-action="true"
              type="button"
              onClick={() => {
                setMobileReading(false);
                window.requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus());
              }}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground lg:hidden"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to messages
            </button>
            <span className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-semibold ${selected.status === "OPEN" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {messageStatusLabels[selected.status] ?? selected.status}
            </span>
            <Link href={`/platform/organizations/${selected.org.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Open organisation<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            <div>
              <h2 ref={headingRef} id="message-subject" tabIndex={-1} className="break-words text-xl font-semibold leading-8 tracking-tight text-foreground outline-none sm:text-2xl">
                {selected.subject}
              </h2>
              <div className="mt-4 flex items-start gap-3">
                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {initials(selected.sender.fullName)}
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-foreground">{selected.sender.fullName}</p>
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">{selected.org.name}</p>
                  <time dateTime={selected.createdAt} className="mt-1 block text-xs text-muted-foreground">
                    {date.format(new Date(selected.createdAt))}
                  </time>
                </div>
              </div>
            </div>

            <div className="min-h-40 whitespace-pre-wrap break-words border-y border-border py-6 text-sm leading-7 text-foreground [overflow-wrap:anywhere]">
              {selected.message}
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contact the sender</h3>
              <div className="flex flex-wrap gap-2">
                {selected.sender.email && (
                  <a data-workspace-action="true" href={`mailto:${encodeURIComponent(selected.sender.email)}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    <Mail aria-hidden="true" className="h-4 w-4" />Reply via email
                  </a>
                )}
                {selected.sender.phone && (
                  <a data-workspace-action="true" href={`tel:${selected.sender.phone.replace(/[^+0-9]/g, "")}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted">
                    <Phone aria-hidden="true" className="h-4 w-4" />Call sender
                  </a>
                )}
                {!selected.sender.email && !selected.sender.phone && (
                  <p className="text-sm text-muted-foreground">No email or phone is available. Open the organisation to review its contact details.</p>
                )}
              </div>
              {selected.sender.email && <p className="mt-2 break-all text-xs text-muted-foreground">{selected.sender.email} · Replies open in your email app.</p>}
            </div>

            <div className="flex flex-wrap items-start gap-2 border-t border-border pt-5">
              {selected.status === "OPEN" && <MessageActionButton action={markPlatformMessageReadAction} messageId={selected.id}><CheckCheck aria-hidden="true" className="h-4 w-4" />Mark read</MessageActionButton>}
              {["OPEN", "READ"].includes(selected.status) && <MessageActionButton action={closePlatformMessageAction} messageId={selected.id}><Archive aria-hidden="true" className="h-4 w-4" />Close message</MessageActionButton>}
              {selected.status !== "SPAM" ? <MessageActionButton action={markPlatformMessageSpamAction} messageId={selected.id}><Ban aria-hidden="true" className="h-4 w-4" />Mark spam</MessageActionButton> : <MessageActionButton action={reopenPlatformMessageAction} messageId={selected.id}><RotateCcw aria-hidden="true" className="h-4 w-4" />Restore to inbox</MessageActionButton>}
              {selected.status === "CLOSED" && <MessageActionButton action={reopenPlatformMessageAction} messageId={selected.id}><RotateCcw aria-hidden="true" className="h-4 w-4" />Reopen message</MessageActionButton>}
              <MessageActionButton action={deletePlatformMessageAction} messageId={selected.id} danger confirm="Permanently delete this message? This cannot be undone."><Trash2 aria-hidden="true" className="h-4 w-4" />Delete</MessageActionButton>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
