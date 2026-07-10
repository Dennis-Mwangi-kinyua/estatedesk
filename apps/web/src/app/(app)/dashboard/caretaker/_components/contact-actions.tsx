"use client";

import { useId, useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { contactHref } from "@/app/(app)/dashboard/caretaker/_lib/contact";

type ContactOption = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

export function ContactActions({
  phone,
  email,
  compact = false,
  label = "Contact",
}: {
  phone?: string | null;
  email?: string | null;
  compact?: boolean;
  /** Accessible / visible label for the dropdown */
  label?: string;
}) {
  const selectId = useId();
  const [value, setValue] = useState("");

  const options: ContactOption[] = [];

  const phoneHref = contactHref("phone", phone);
  const smsHref = contactHref("sms", phone);
  const whatsappHref = contactHref("whatsapp", phone);
  const emailHref = contactHref("email", email);

  if (phoneHref) {
    options.push({ id: "call", label: "Call", href: phoneHref });
  }
  if (smsHref) {
    options.push({ id: "sms", label: "SMS", href: smsHref });
  }
  if (whatsappHref) {
    options.push({
      id: "whatsapp",
      label: "WhatsApp",
      href: whatsappHref,
      external: true,
    });
  }
  if (emailHref) {
    options.push({ id: "email", label: "Email", href: emailHref });
  }

  if (options.length === 0) {
    return (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        No contact
      </span>
    );
  }

  function openSelected(next: string) {
    const option = options.find((item) => item.id === next);
    if (!option) return;

    if (option.external) {
      window.open(option.href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = option.href;
    }

    // Reset so the same action can be chosen again
    setValue("");
  }

  return (
    <div
      className={
        compact
          ? "inline-flex min-w-[9.5rem] max-w-full flex-col gap-1"
          : "flex w-full flex-col gap-1.5"
      }
    >
      {!compact ? (
        <label
          htmlFor={selectId}
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          {label}
        </label>
      ) : (
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
      )}

      <div className="relative">
        <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <select
          id={selectId}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            if (next) openSelected(next);
          }}
          className={
            compact
              ? "h-9 w-full min-w-[9.5rem] appearance-none rounded-xl border border-border bg-background py-1.5 pl-9 pr-8 text-xs font-semibold text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              : "h-11 w-full appearance-none rounded-2xl border border-border bg-background py-2 pl-10 pr-9 text-sm font-medium text-foreground outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          }
        >
          <option value="" disabled>
            {compact ? "Contact…" : "Select how to contact…"}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
