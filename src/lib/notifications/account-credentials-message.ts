export type AccountCredentialsMessageInput = {
  fullName: string;
  username: string;
  password: string;
  role?: string;
  loginUrl?: string | null;
};

export function buildAccountCredentialsMessage(
  input: AccountCredentialsMessageInput,
) {
  const role = input.role ?? "TENANT";

  return [
    `Hello ${input.fullName}, your EstateDesk ${role} account has been created.`,
    "",
    `Username: ${input.username}`,
    `Temporary password: ${input.password}`,
    input.loginUrl ? `Login: ${input.loginUrl}` : null,
    "",
    "For your security, you will be asked to change this password the first time you sign in.",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeKenyaPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("254")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }

  return digits;
}

export function buildAccountCredentialsEmailHref(
  input: AccountCredentialsMessageInput,
  recipientEmail?: string | null,
) {
  const role = input.role ?? "TENANT";
  const subject = encodeURIComponent(`Your EstateDesk ${role} account`);
  const body = encodeURIComponent(buildAccountCredentialsMessage(input));
  const recipient = recipientEmail?.trim();

  return recipient
    ? `mailto:${recipient}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;
}

export function buildAccountCredentialsWhatsAppHref(
  input: AccountCredentialsMessageInput,
  recipientPhone?: string | null,
) {
  const text = encodeURIComponent(buildAccountCredentialsMessage(input));
  const phone = recipientPhone?.trim();

  if (phone) {
    const normalized = normalizeKenyaPhone(phone);
    if (normalized) {
      return `https://wa.me/${normalized}?text=${text}`;
    }
  }

  return `https://wa.me/?text=${text}`;
}