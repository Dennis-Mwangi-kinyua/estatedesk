"use client";

import { useMemo, useState } from "react";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { vacancyShareHref, type VacancySharePlatform } from "@/lib/vacancy-share";

type VacancyShareActionsProps = {
  url: string;
  title: string;
  text?: string;
  compact?: boolean;
};

function ShareBrandIcon({ platform, className }: { platform: VacancySharePlatform; className?: string }) {
  if (platform === "whatsapp") {
    return <MessageCircle className={className} aria-hidden="true" />;
  }

  if (platform === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        />
      </svg>
    );
  }

  if (platform === "x") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a-2.065 2.065 0 1 1 0-4.13 2.065 2.065 0 0 1 0 4.13zM3.555 20.452h3.564V9H3.555v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

const SHARE_LINKS: Array<{ platform: VacancySharePlatform; label: string }> = [
  { platform: "whatsapp", label: "WhatsApp" },
  { platform: "facebook", label: "Facebook" },
  { platform: "x", label: "X" },
  { platform: "linkedin", label: "LinkedIn" },
];

export function VacancyShareActions({
  url,
  title,
  text,
  compact = false,
}: VacancyShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const shareText = text ?? title;
  const links = useMemo(
    () =>
      SHARE_LINKS.map((item) => ({
        ...item,
        href: vacancyShareHref(item.platform, url, shareText),
      })),
    [shareText, url],
  );

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text: shareText, url });
      return;
    }

    await copyLink();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#9ca3af]">
          Share listing
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {links.map((item) => (
            <a
              key={item.platform}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f16] dark:text-[#f8fafc] dark:hover:bg-white/[0.10]"
              aria-label={`Share vacancy on ${item.label}`}
              title={item.label}
            >
              <ShareBrandIcon platform={item.platform} className="h-3.5 w-3.5" />
            </a>
          ))}
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-[#111827] dark:text-[#e5e7eb] dark:hover:bg-white/[0.10]"
            aria-label={copied ? "Link copied" : "Copy vacancy link"}
            title={copied ? "Copied" : "Copy link"}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f16] dark:text-[#f8fafc] dark:hover:bg-white/[0.10]"
            aria-label="Share vacancy link"
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#9ca3af]">
          Share
        </p>
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f16] dark:text-[#f8fafc] dark:hover:bg-white/[0.10]"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share link
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {links.map((item) => (
          <a
            key={item.platform}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f16] dark:text-[#f8fafc] dark:hover:bg-white/[0.10]"
            aria-label={`Share vacancy on ${item.label}`}
          >
            <ShareBrandIcon platform={item.platform} className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-[#111827] dark:text-[#e5e7eb] dark:hover:bg-white/[0.10]"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}