import type { CreateOrganizationState } from "../actions";
type Account = NonNullable<CreateOrganizationState["createdAccount"]>;

export function accountHandoverText(account: Account, loginUrl: string, password?: string) {
  return [
    `Hello ${account.fullName}, your EstateDesk account is ready.`,
    `Workspace: ${account.organizationName}`,
    `Account type: ${account.accountType === "LANDLORD" ? "Landlord" : "Agency"}`,
    `Sign in: ${loginUrl}`, `Username: ${account.username}`, `Email: ${account.email}`,
    password ? `Temporary password: ${password}` : "Your temporary password will be shared separately.",
    "Change your temporary password on first login, then complete your workspace setup.",
  ].join("\n");
}

export function accountShareUrl(channel: "whatsapp" | "sms" | "email", text: string, email: string, phone: string) {
  if (channel === "email") return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Your EstateDesk account")}&body=${encodeURIComponent(text)}`;
  if (channel === "sms") return `sms:${phone.replace(/[^+\d]/g, "")}?body=${encodeURIComponent(text)}`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
