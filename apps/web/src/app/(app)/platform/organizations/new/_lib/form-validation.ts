export function isValidTimezone(value: string) {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return Boolean(value.trim()); } catch { return false; }
}
export function normalizePhone(value: string) { return value.replace(/[\s().-]/g, ""); }
export function isValidPhone(value: string) { return !value.trim() || /^\+[1-9]\d{7,14}$/.test(normalizePhone(value)); }
export function organizationSlug(value: string) { return value.toLowerCase().trim().replace(/["']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

export const accountFieldLabels: Record<string, string> = {
  organizationName: "Workspace name", organizationSlug: "Workspace address", organizationEmail: "Workspace email",
  organizationPhone: "Workspace phone", organizationAddress: "Address", currencyCode: "Currency", timezone: "Timezone",
  dataRetentionDays: "Data retention", plan: "Plan", accountType: "Account type", adminFullName: "Owner name",
  adminUsername: "Username", adminEmail: "Login email", adminPhone: "Owner phone", adminPassword: "Temporary password",
  adminPasswordConfirm: "Confirm password",
};

export function validateAccountStep(step: number, values: Record<string, string>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const require = (key: string, valid: boolean, message: string) => { if (!valid) errors[key] = [message]; };
  if (step === 1) {
    require("organizationSlug", Boolean(organizationSlug(values.organizationSlug || values.organizationName)), "Use a workspace address containing letters or numbers.");
    require("organizationPhone", isValidPhone(values.organizationPhone || ""), "Use international format, for example +254700000000.");
    require("organizationName", values.organizationName.trim().length >= 2, "Enter a workspace name with at least 2 characters.");
    require("organizationEmail", !values.organizationEmail.trim() || email.test(values.organizationEmail.trim()), "Enter a valid email or leave this optional field blank.");
    require("timezone", isValidTimezone(values.timezone), "Choose a valid timezone.");
    require("dataRetentionDays", Number.isInteger(Number(values.dataRetentionDays)) && Number(values.dataRetentionDays) > 0, "Enter a whole number greater than zero.");
    require("plan", ["FREE", "PRO", "PLUS", "ENTERPRISE"].includes(values.plan), "Choose a plan.");
    require("accountType", ["PROPERTY_MANAGER", "LANDLORD"].includes(values.accountType), "Choose an agency or landlord account.");
  } else {
    require("adminPhone", isValidPhone(values.adminPhone || ""), "Use international format, for example +254700000000.");
    require("adminFullName", values.adminFullName.trim().length >= 2, "Enter the account owner’s full name.");
    require("adminUsername", /^[a-z0-9._-]{3,30}$/.test(values.adminUsername.trim()), "Use 3–30 lowercase letters, numbers, dots, underscores, or hyphens.");
    require("adminEmail", email.test(values.adminEmail.trim()), "Enter a valid login email.");
    require("adminPassword", values.adminPassword.length >= 8, "Use at least 8 characters or generate a secure password.");
    require("adminPasswordConfirm", Boolean(values.adminPasswordConfirm) && values.adminPassword === values.adminPasswordConfirm, "Both passwords must match.");
  }
  return errors;
}
