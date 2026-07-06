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
  if (step >= 5) return 5;
  return (step + 1) as Step;
}

export function getPreviousStep(step: Step): Step {
  if (step <= 1) return 1;
  return (step - 1) as Step;
}

export function generateClientPassword(length = 10) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let password = "";
  for (let index = 0; index < length; index += 1) {
    password += alphabet[bytes[index] % alphabet.length];
  }

  return password;
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