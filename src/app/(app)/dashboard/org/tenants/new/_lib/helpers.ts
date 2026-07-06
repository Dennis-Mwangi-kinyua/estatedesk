import type { Step } from "./types";

export function formatCurrency(
  value: number | null | undefined,
  currencyCode: string,
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatStatus(value: string) {
  if (!value) return "—";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function getNextStep(step: Step): Step {
  switch (step) {
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 4;
    case 4:
    default:
      return 4;
  }
}

export function getPreviousStep(step: Step): Step {
  switch (step) {
    case 4:
      return 3;
    case 3:
      return 2;
    case 2:
      return 1;
    case 1:
    default:
      return 1;
  }
}

export function buildUsernamePreview(fullName: string) {
  const normalized = fullName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 18);

  return normalized || "tenant";
}

export function focusField(form: HTMLFormElement, fieldName: string) {
  const field = form.elements.namedItem(fieldName);
  if (field instanceof HTMLElement) {
    field.focus();
  }
}