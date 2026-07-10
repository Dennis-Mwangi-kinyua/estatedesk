"use client";

import { CheckCircle2, Loader2, Ticket, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LookupStatus = "idle" | "loading" | "found" | "not_found" | "error";

type ReferralCodeFieldProps = {
  defaultCode?: string;
};

function normalizeReferralCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function ReferralCodeField({ defaultCode = "" }: ReferralCodeFieldProps) {
  const [code, setCode] = useState(() => normalizeReferralCode(defaultCode));
  const [status, setStatus] = useState<LookupStatus>(() =>
    defaultCode ? "loading" : "idle",
  );
  const [marketerName, setMarketerName] = useState("");

  const helper = useMemo(() => {
    if (!code) {
      return {
        Icon: Ticket,
        className:
          "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#d1d5db]",
        text: "Optional. Enter a marketer promo code if someone referred you.",
      };
    }

    if (status === "loading") {
      return {
        Icon: Loader2,
        className:
          "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#d1d5db]",
        text: "Checking promo code...",
      };
    }

    if (status === "found") {
      return {
        Icon: CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-100",
        text: `Referral confirmed: ${marketerName}`,
      };
    }

    if (status === "not_found") {
      return {
        Icon: XCircle,
        className:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/12 dark:text-amber-100",
        text: "No active marketer found. The code will still be recorded for review.",
      };
    }

    return {
      Icon: XCircle,
      className:
        "border-red-200 bg-red-50 text-red-800 dark:border-red-300/30 dark:bg-red-300/12 dark:text-red-100",
      text: "Could not check this code right now. You can still continue.",
    };
  }, [code, marketerName, status]);

  useEffect(() => {
    if (!code) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/marketing/referrals/${encodeURIComponent(code)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setStatus("error");
          setMarketerName("");
          return;
        }

        const data = (await response.json()) as
          | {
              found: true;
              marketer: {
                fullName: string;
                referralCode: string;
              };
            }
          | { found: false };

        if (data.found) {
          setStatus("found");
          setMarketerName(data.marketer.fullName);
        } else {
          setStatus("not_found");
          setMarketerName("");
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
          setMarketerName("");
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [code]);

  const Icon = helper.Icon;

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-[#f8fafc]">
          Promo code (optional)
        </span>
        <input
          name="referralCode"
          type="text"
          value={code}
          onChange={(event) => {
            const nextCode = normalizeReferralCode(event.target.value);
            setCode(nextCode);

            if (!nextCode) {
              setStatus("idle");
              setMarketerName("");
            }
          }}
          maxLength={40}
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold uppercase text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 dark:border-white/[0.16] dark:bg-[#171b22] dark:text-[#f8fafc] dark:placeholder:text-[#9ca3af] dark:focus:border-white/40 dark:focus:ring-white/10"
          placeholder="Example: JANE10"
        />
      </label>
      <div
        className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-5 ${helper.className}`}
      >
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            status === "loading" ? "animate-spin" : ""
          }`}
        />
        <span>{helper.text}</span>
      </div>
    </div>
  );
}
