"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Share2, Copy } from "lucide-react";
import { accountHandoverText, accountShareUrl } from "../_lib/account-handover";
import { createCredentialsPdf } from "../_lib/credentials-pdf";
import type { CreateOrganizationState } from "../actions";

type Account = NonNullable<CreateOrganizationState["createdAccount"]>;

export function AccountCreated({ account, temporaryPassword }: { account: Account; temporaryPassword: string }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");
  const [includePassword, setIncludePassword] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(account.phone ?? "");
  const [recipientEmail, setRecipientEmail] = useState(account.email);
  const [notice, setNotice] = useState("");

  function summary() {
    return accountHandoverText(account, `${window.location.origin}/login`, includePassword ? temporaryPassword : undefined);
  }

  function openShare(channel: "whatsapp" | "sms" | "email") {
    const url = accountShareUrl(channel, summary(), recipientEmail, recipientPhone);
    if (channel === "whatsapp") window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
    setNotice("Message prepared. Review it in your messaging app before sending.");
  }

  async function copySummary() {
    try { await navigator.clipboard.writeText(summary()); setNotice("Account summary copied."); }
    catch { setError("Copy is unavailable. Use one of the sharing options or download the PDF."); }
  }

  async function sharePdf() {
    setDownloading(true);
    setError("");
    try {
      const bytes = await createCredentialsPdf(account, temporaryPassword, `${window.location.origin}/login`);
      const file = new File([new Uint8Array(bytes)], `estatedesk-${account.slug}-credentials.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "EstateDesk account credentials" });
        setNotice("PDF handed to your device’s sharing app.");
      } else {
        setNotice("File sharing is unavailable on this device. Download the PDF and attach it to your message.");
        await downloadCredentials();
      }
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) setError("The PDF could not be shared. Download it and attach it manually.");
    } finally { setDownloading(false); }
  }

  async function downloadCredentials() {
    setDownloading(true);
    setError("");
    try {
      const bytes = await createCredentialsPdf(account, temporaryPassword, `${window.location.origin}/login`);
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `estatedesk-${account.slug}-credentials.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloaded(true);
    } catch {
      setError("The PDF could not be generated. Please try downloading again before leaving this page.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="system-glass-card space-y-5 rounded-3xl border p-5 sm:p-8">
      <span aria-hidden="true" className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-4xl">🎉</span>
      <div role="status"><h1 className="text-2xl font-semibold">Account created</h1><p className="mt-2 text-sm text-muted-foreground">{account.organizationName} is ready. Download the credentials PDF before leaving this page.</p></div>
      <p role="status" className="text-sm">{account.verificationSent ? "A verification email was sent to the owner. Verify the email before signing in." : "Email verification is required. Request a verification email using the link below."} Phone remains unverified.</p>
      <div className="flex flex-wrap gap-3 text-sm"><Link className="underline" href={`/verify-email?email=${encodeURIComponent(account.email)}`}>Resend verification email</Link><Link className="underline" href="/forgot-password">Reset a lost temporary password</Link><Link className="underline" href={`/platform/organizations/${account.slug}`}>Open organisation</Link></div>
      <ol className="list-inside list-decimal text-sm text-muted-foreground"><li>Verify email and change the temporary password.</li><li>Add a property and its units.</li><li>Add staff, tenants, and leases.</li><li>Configure billing and payment collection in Settings.</li></ol>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Account owner</dt><dd className="break-words font-medium">{account.fullName}</dd></div>
        <div><dt className="text-muted-foreground">Username</dt><dd className="break-all font-medium">{account.username}</dd></div>
        <div><dt className="text-muted-foreground">Login email</dt><dd className="break-all font-medium">{account.email}</dd></div>
        <div><dt className="text-muted-foreground">Workspace</dt><dd className="break-all font-medium">{account.slug}</dd></div>
      </dl>
      <p className="text-sm text-muted-foreground">The PDF contains the temporary password. Share it privately with the account owner, who must change it on first login. The download is available only during this creation session.</p>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={downloading} onClick={downloadCredentials} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"><Download className="h-4 w-4" />{downloading ? "Preparing PDF…" : downloaded ? "Download PDF again" : "Download credentials PDF"}</button>
        <Link href="/platform/organizations" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium">View organizations</Link>
      </div>
      <section className="space-y-4 rounded-2xl border border-border p-4 sm:p-5" aria-labelledby="handover-title">
        <h2 id="handover-title" className="text-lg font-semibold"><span aria-hidden="true">🤝 </span>Share the account handover</h2>
        <p className="text-sm text-muted-foreground">Prepare a message for the account owner. WhatsApp, SMS, and email open a draft for you to review and send. Download the PDF to attach it, or use your device’s file sharing.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm"><span>Recipient phone (international format)</span><input type="tel" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} placeholder="+254700000000" className="min-h-11 w-full border px-3" /></label>
          <label className="space-y-1 text-sm"><span>Recipient email</span><input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} className="min-h-11 w-full border px-3" /></label>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={includePassword} onChange={(event) => setIncludePassword(event.target.checked)} />Include the temporary password in the message</label>
        <p className="text-xs text-muted-foreground">The PDF always includes the temporary password. Message summaries omit it unless you select the option above.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {([{channel: "whatsapp", label: "WhatsApp", emoji: "💬"}, {channel: "sms", label: "SMS", emoji: "📱"}, {channel: "email", label: "Email", emoji: "✉️"}] as const).map((item) => <button key={item.channel} type="button" onClick={() => openShare(item.channel)} disabled={downloading || (item.channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"><span aria-hidden="true">{item.emoji}</span>{item.label}</button>)}
          <button type="button" onClick={copySummary} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"><Copy className="h-4 w-4" />Copy summary</button>
          <button type="button" disabled={downloading} onClick={sharePdf} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"><Share2 className="h-4 w-4" />Share PDF</button>
        </div>
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      </section>
      {downloaded && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">PDF download started. Check your downloads before leaving.</p>}
    </section>
  );
}
