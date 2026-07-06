"use client";

import { useCaretakerLocale } from "../_lib/use-caretaker-locale";
import {
  caretakerLabel,
  type CaretakerI18nKey,
  type CaretakerNavKey,
} from "../_lib/i18n";

export function CaretakerNavLabel({ labelKey }: { labelKey: CaretakerNavKey }) {
  const locale = useCaretakerLocale();
  return <>{caretakerLabel(locale, labelKey)}</>;
}

export function CaretakerTextLabel({ labelKey }: { labelKey: CaretakerI18nKey }) {
  const locale = useCaretakerLocale();
  return <>{caretakerLabel(locale, labelKey)}</>;
}