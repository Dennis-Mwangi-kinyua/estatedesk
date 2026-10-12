export type AccountCredentialsMessageInput = {
  fullName: string;
  username: string;
  password?: string;
  organizationName?: string;
  email?: string | null;
  role?: string;
  loginUrl?: string | null;
};

export function buildAccountCredentialsMessage(
  input: AccountCredentialsMessageInput,
) {
  const role = (input.role ?? "TENANT").toLowerCase().replaceAll("_", " ");
  return [
    `Hello ${input.fullName},`,
    "",
    `Welcome to EstateDesk. Your ${role} account is ready.`,
    "",
    input.organizationName ? `Workspace: ${input.organizationName}` : null,
    input.loginUrl ? `Login: ${input.loginUrl}` : null,
    `Username: ${input.username}`,
    input.email ? `Email: ${input.email}` : null,
    input.password ? `Temporary password: ${input.password}` : "Your temporary password will be shared separately.",
    "",
    "To get started, open the login link and sign in with your username and temporary password.",
    "You will be asked to choose a new password on your first sign-in.",
    "Keep your login details private. If you need help, contact the administrator who created your account.",
    "",
    "Kind regards,",
    "The EstateDesk Team",
  ].filter(line => line !== null).join("\n");
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
  const subject = encodeURIComponent("Your EstateDesk account — sign-in details");
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