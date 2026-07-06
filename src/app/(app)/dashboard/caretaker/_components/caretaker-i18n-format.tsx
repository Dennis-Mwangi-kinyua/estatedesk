"use client";

import { caretakerLabel, type CaretakerI18nKey } from "../_lib/i18n";
import { useCaretakerLocale } from "../_lib/use-caretaker-locale";

export function CaretakerI18nFormat({
  labelKey,
  values,
}: {
  labelKey: CaretakerI18nKey;
  values?: Record<string, string | number>;
}) {
  const locale = useCaretakerLocale();
  let text: string = caretakerLabel(locale, labelKey);

  if (values) {
    for (const [key, value] of Object.entries(values)) {
      text = text.replaceAll(`{${key}}`, String(value));
    }
  }

  return <>{text}</>;
}