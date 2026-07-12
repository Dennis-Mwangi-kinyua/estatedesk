"use client";

import { useEffect, useState } from "react";
import {
  CARETAKER_LOCALE_STORAGE_KEY,
  type CaretakerLocale,
} from "./i18n";

function readStoredLocale(): CaretakerLocale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(CARETAKER_LOCALE_STORAGE_KEY);
  return stored === "en" || stored === "sw" ? stored : "en";
}

export function useCaretakerLocale() {
  const [locale, setLocale] = useState<CaretakerLocale>(readStoredLocale);

  useEffect(() => {
    function handleLocaleChange(event: Event) {
      const detail = (event as CustomEvent<CaretakerLocale>).detail;
      if (detail === "en" || detail === "sw") {
        setLocale(detail);
      }
    }

    window.addEventListener("caretaker-locale-change", handleLocaleChange);
    return () => {
      window.removeEventListener("caretaker-locale-change", handleLocaleChange);
    };
  }, []);

  return locale;
}
