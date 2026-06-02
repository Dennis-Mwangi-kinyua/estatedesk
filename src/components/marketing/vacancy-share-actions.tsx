"use client";

import { useMemo, useState } from "react";
import { Copy, MessageCircle, Send, Share2 } from "lucide-react";

type VacancyShareActionsProps = {
  url: string;
  title: string;
  text?: string;
  compact?: boolean;
};

function shareHref(platform: "whatsapp" | "facebook" | "x" | "linkedin", url: string, text: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  if (platform === "whatsapp") return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  if (platform === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
}

export function VacancyShareActions({
  url,
  title,
  text,
  compact = false,
}: VacancyShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const shareText = text ?? title;
  const links = useMemo(
    () => [
      { label: "WhatsApp", href: shareHref("whatsapp", url, shareText), icon: MessageCircle },
      { label: "Facebook", href: shareHref("facebook", url, shareText), textIcon: "f" },
      { label: "X", href: shareHref("x", url, shareText), textIcon: "X" },
      { label: "LinkedIn", href: shareHref("linkedin", url, shareText), textIcon: "in" },
    ],
    [shareText, url],
  );

  async function nativeShare() {
    if (navigator.share) {
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

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
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
          {compact ? "Share" : "Share link"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {links.map((item) => {
          const Icon = "icon" in item ? item.icon : null;

          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f16] dark:text-[#f8fafc] dark:hover:bg-white/[0.10]"
              aria-label={`Share vacancy on ${item.label}`}
            >
              {Icon ? (
                <Icon className="h-3.5 w-3.5" />
              ) : (
                <span className="text-[11px] font-black">{item.textIcon}</span>
              )}
              <span className="truncate">{compact ? item.label.slice(0, 2) : item.label}</span>
            </a>
          );
        })}
      </div>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-[#111827] dark:text-[#e5e7eb] dark:hover:bg-white/[0.10]"
      >
        {copied ? <Send className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
