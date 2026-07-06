"use client";

import { caretakerLabel, type CaretakerI18nKey } from "../_lib/i18n";
import { useCaretakerLocale } from "../_lib/use-caretaker-locale";

export function CaretakerI18nLabel({ labelKey }: { labelKey: CaretakerI18nKey }) {
  const locale = useCaretakerLocale();
  return <>{caretakerLabel(locale, labelKey)}</>;
}