"use client";

import { useEffect, useState } from "react";
import {
  CARETAKER_LOCALE_STORAGE_KEY,
  type CaretakerLocale,
} from "./i18n";

export function useCaretakerLocale() {
  const [locale, setLocale] = useState<CaretakerLocale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(CARETAKER_LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "sw") {
      setLocale(stored);
    }

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