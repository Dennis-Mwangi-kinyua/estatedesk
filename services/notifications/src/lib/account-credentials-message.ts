export type AccountCredentialsMessageInput = {
  fullName: string;
  username: string;
  /** One-time temporary password, shown only in the account handover draft. */
  password?: string;
  temporaryPassword?: string;
  setupUrl?: string;
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
    input.setupUrl ? `Set your password: ${input.setupUrl}` : input.temporaryPassword ? `Temporary password: ${input.temporaryPassword}` : "Sign in with your existing password, or use Forgot password to recover access.",
    "",
    input.setupUrl ? "This setup link expires in one hour and can be used once. Choose your own password before signing in." : input.temporaryPassword ? "This temporary password is unique to your account. You must change it immediately after your first sign-in." : null,
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
