import type { SensitiveFieldKey, TenantProfileViewModel } from "./types";

export const INITIAL_REVEAL_STATE: Record<SensitiveFieldKey, boolean> = {
  phone: false,
  email: false,
  nationalId: false,
  kraPin: false,
  nextOfKinPhone: false,
  nextOfKinEmail: false,
};

export const FIELD_LABELS: Record<SensitiveFieldKey, string> = {
  phone: "Phone",
  email: "Email",
  nationalId: "National ID",
  kraPin: "KRA PIN",
  nextOfKinPhone: "Next of Kin Phone",
  nextOfKinEmail: "Next of Kin Email",
};

export function displayValue(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";
  return value;
}

export function humanizeTenantType(type?: TenantProfileViewModel["type"]) {
  if (!type) return "Not available";
  return type === "COMPANY" ? "Company" : "Individual";
}

export function humanizeStatus(status?: TenantProfileViewModel["status"]) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "INACTIVE":
      return "Inactive";
    case "BLACKLISTED":
      return "Blacklisted";
    default:
      return "Unknown";
  }
}

export function statusBadgeStyles(status?: TenantProfileViewModel["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-200";
    case "INACTIVE":
      return "bg-amber-500/10 text-amber-700 ring-amber-200";
    case "BLACKLISTED":
      return "bg-red-500/10 text-red-700 ring-red-200";
    default:
      return "bg-neutral-500/10 text-foreground/80 ring-neutral-200";
  }
}

export function initialsFromName(name?: string | null) {
  if (!name) return "T";

  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "T"
  );
}

function maskPhone(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const cleaned = value.trim();
  if (cleaned.length <= 4) return "••••";

  return `${cleaned.slice(0, 3)}••••${cleaned.slice(-2)}`;
}

function maskEmail(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const [local, domain] = value.split("@");
  if (!local || !domain) return "Hidden";

  const visibleLocal =
    local.length <= 2 ? `${local[0] ?? ""}•••` : `${local.slice(0, 2)}••••`;

  return `${visibleLocal}@${domain}`;
}

function maskNationalId(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const cleaned = value.trim();
  if (cleaned.length <= 2) return "••••";

  return `••••••${cleaned.slice(-2)}`;
}

function maskKraPin(value?: string | null) {
  if (!value || value.trim() === "") return "Not provided";

  const cleaned = value.trim();
  if (cleaned.length <= 3) return "••••••";

  return `${cleaned.slice(0, 1)}••••••${cleaned.slice(-2)}`;
}

function getMaskedValue(field: SensitiveFieldKey, value?: string | null) {
  switch (field) {
    case "phone":
    case "nextOfKinPhone":
      return maskPhone(value);
    case "email":
    case "nextOfKinEmail":
      return maskEmail(value);
    case "nationalId":
      return maskNationalId(value);
    case "kraPin":
      return maskKraPin(value);
    default:
      return "Hidden";
  }
}

export function getVisibleValue(
  revealed: boolean,
  field: SensitiveFieldKey,
  value?: string | null,
) {
  return revealed ? displayValue(value) : getMaskedValue(field, value);
}