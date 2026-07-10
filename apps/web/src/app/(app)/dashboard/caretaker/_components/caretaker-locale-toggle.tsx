"use client";

import { useEffect, useState } from "react";
import {
  CARETAKER_LOCALE_STORAGE_KEY,
  type CaretakerLocale,
} from "../_lib/i18n";

type Props = {
  className?: string;
};

export function CaretakerLocaleToggle({ className = "" }: Props) {
  const [locale, setLocale] = useState<CaretakerLocale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(CARETAKER_LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "sw") {
      setLocale(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function updateLocale(next: CaretakerLocale) {
    setLocale(next);
    window.localStorage.setItem(CARETAKER_LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    window.dispatchEvent(
      new CustomEvent("caretaker-locale-change", { detail: next }),
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-2xl border border-border bg-background p-1 ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => updateLocale("en")}
        className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => updateLocale("sw")}
        className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
          locale === "sw"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        SW
      </button>
    </div>
  );
}