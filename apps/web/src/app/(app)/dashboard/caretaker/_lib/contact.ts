export function normalizeKenyaPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("254")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }

  return digits;
}

export function contactHref(
  kind: "phone" | "sms" | "email" | "whatsapp",
  value: string | null | undefined,
) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (kind === "email") {
    return `mailto:${trimmed}`;
  }

  if (kind === "sms") {
    return `sms:${trimmed}`;
  }

  if (kind === "whatsapp") {
    const normalized = normalizeKenyaPhone(trimmed);
    return normalized ? `https://wa.me/${normalized}` : null;
  }

  return `tel:${trimmed}`;
}