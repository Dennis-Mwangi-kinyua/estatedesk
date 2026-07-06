import { Mail, MessageCircle, Phone } from "lucide-react";
import { contactHref } from "@/app/(app)/dashboard/caretaker/_lib/contact";

const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition";

export function ContactActions({
  phone,
  email,
  compact = false,
}: {
  phone?: string | null;
  email?: string | null;
  compact?: boolean;
}) {
  const phoneHref = contactHref("phone", phone);
  const smsHref = contactHref("sms", phone);
  const whatsappHref = contactHref("whatsapp", phone);
  const emailHref = contactHref("email", email);

  if (!phoneHref && !emailHref) {
    return null;
  }

  return (
    <div
      className={
        compact
          ? "flex flex-wrap gap-2"
          : "grid grid-cols-2 gap-2 sm:grid-cols-4"
      }
    >
      <a
        href={phoneHref ?? undefined}
        aria-disabled={!phoneHref}
        className={`${buttonClass} ${
          phoneHref
            ? "bg-primary text-primary-foreground"
            : "pointer-events-none bg-muted/20 text-muted-foreground"
        }`}
      >
        <Phone className="h-3.5 w-3.5" />
        Call
      </a>
      <a
        href={smsHref ?? undefined}
        aria-disabled={!smsHref}
        className={`${buttonClass} ${
          smsHref
            ? "border border-border bg-background text-foreground"
            : "pointer-events-none bg-muted/20 text-muted-foreground"
        }`}
      >
        SMS
      </a>
      <a
        href={whatsappHref ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!whatsappHref}
        className={`${buttonClass} ${
          whatsappHref
            ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            : "pointer-events-none bg-muted/20 text-muted-foreground"
        }`}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        WhatsApp
      </a>
      <a
        href={emailHref ?? undefined}
        aria-disabled={!emailHref}
        className={`${buttonClass} ${
          emailHref
            ? "border border-border bg-background text-foreground"
            : "pointer-events-none bg-muted/20 text-muted-foreground"
        }`}
      >
        <Mail className="h-3.5 w-3.5" />
        Email
      </a>
    </div>
  );
}