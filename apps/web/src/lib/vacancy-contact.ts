/** Normalize a Kenya/regional phone into digits for wa.me / tel links. */
export function normalizePhoneDigits(phone: string | null | undefined) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  // Local Kenya numbers: 07xxxxxxxx / 01xxxxxxxx → 254...
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `254${digits.slice(1)}`;
  } else if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    digits = `254${digits}`;
  }

  return digits;
}

export function telHref(phone: string | null | undefined, fallback = "/contact") {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return fallback;
  return `tel:+${digits}`;
}

export function whatsappHref(
  phone: string | null | undefined,
  text: string,
): string | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function mapsSearchHref(place: string | null | undefined) {
  if (!place?.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.trim())}`;
}
