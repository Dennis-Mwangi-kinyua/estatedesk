import { buildAccountCredentialsMessage } from "@/lib/notifications/account-credentials-message";
import type { CreateOrganizationState } from "../actions";
type Account = NonNullable<CreateOrganizationState["createdAccount"]>;

export function accountHandoverText(account: Account, loginUrl: string, password?: string) {
  return buildAccountCredentialsMessage({ fullName: account.fullName, username: account.username, password, email: account.email, role: account.accountType === "LANDLORD" ? "LANDLORD" : "Organization administrator", organizationName: account.organizationName, loginUrl });
}

export function accountShareUrl(channel: "whatsapp" | "sms" | "email", text: string, email: string, phone: string) {
  if (channel === "email") return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Your EstateDesk account")}&body=${encodeURIComponent(text)}`;
  if (channel === "sms") return `sms:${phone.replace(/[^+\d]/g, "")}?body=${encodeURIComponent(text)}`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
