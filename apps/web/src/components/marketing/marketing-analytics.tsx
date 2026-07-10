"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const CONSENT_KEY = "estatedesk:analytics-consent";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readConsent() {
  if (typeof window === "undefined") return "unset";
  return window.localStorage.getItem(CONSENT_KEY) ?? "unset";
}

function trackConversion(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", name, {
    app_area: "marketing",
    page_path: window.location.pathname,
    ...params,
  });
}

function eventForAnchor(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href") ?? "";

  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (href === "/register" || href.startsWith("/register?")) return "registration_intent";
  if (href === "/contact" || href.startsWith("/contact?")) return "contact_sales_intent";
  if (href === "/pricing" || href.startsWith("/pricing?")) return "pricing_view_intent";

  return null;
}

export function MarketingAnalytics() {
  const bootstrapId = gaMeasurementId ?? googleAdsId;
  const [consent, setConsent] = useState("unset");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setConsent(readConsent());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!bootstrapId || consent !== "granted") return;

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const conversion = anchor.dataset.conversionEvent ?? eventForAnchor(anchor);
      if (!conversion) return;

      trackConversion(conversion, {
        link_url: anchor.href,
        link_text: anchor.textContent?.replace(/\s+/g, " ").trim().slice(0, 120),
        source_path: window.location.pathname,
      });
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const conversion = form.dataset.conversionEvent;
      if (!conversion) return;

      trackConversion(conversion, {
        form_id: form.id || undefined,
        source_path: window.location.pathname,
      });
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [bootstrapId, consent]);

  if (!bootstrapId) return null;

  const configuredIds = [gaMeasurementId, googleAdsId].filter(Boolean);
  const analyticsEnabled = consent === "granted";

  return (
    <>
      {analyticsEnabled ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${bootstrapId}`}
            strategy="afterInteractive"
          />
          <Script id="estatedesk-gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${configuredIds
                .map((id) => `gtag('config', '${id}', { send_page_view: true });`)
                .join("\n")}
            `}
          </Script>
        </>
      ) : null}

      {consent === "unset" ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
          <p className="font-semibold text-slate-950 dark:text-white">
            Help improve EstateDesk
          </p>
          <p className="mt-1 leading-5">
            We use analytics to measure page performance and lead conversion. You can decline and keep using the site normally.
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-800 dark:border-white/10 dark:text-slate-100"
              onClick={() => {
                window.localStorage.setItem(CONSENT_KEY, "denied");
                setConsent("denied");
              }}
            >
              Decline
            </button>
            <button
              type="button"
              className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              onClick={() => {
                window.localStorage.setItem(CONSENT_KEY, "granted");
                setConsent("granted");
                trackConversion("analytics_consent_granted");
              }}
            >
              Allow analytics
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
