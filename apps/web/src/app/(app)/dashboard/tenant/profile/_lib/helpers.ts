export function maskPhone(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${value.slice(0, 3)}••••${value.slice(-2)}`;
}

export function maskEmail(value: string | null | undefined) {
  if (!value) return "—";
  const [name, domain] = value.split("@");
  if (!name || !domain) return value;
  return `${name.slice(0, 2)}••••@${domain}`;
}

export function maskText(value: string | null | undefined, visible = 1, tail = 2) {
  if (!value) return "—";
  if (value.length <= visible + tail) return value;
  return `${value.slice(0, visible)}••••••${value.slice(-tail)}`;
}

export function statusTone(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-foreground/80";
  }
}

export function paymentHealthTone(tone: string | null | undefined) {
  switch (tone) {
    case "settled":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "default":
      return "border-red-200 bg-red-50 text-red-700";
    case "overdue":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "due":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-foreground/80";
  }
}

export function yesNoTone(value: boolean) {
  return value
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-neutral-200 bg-neutral-50 text-neutral-600";
}