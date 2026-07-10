export type ActionFeedbackMessageType = "success" | "error";

const queryMessageLabels: Record<string, string> = {
  "confirm-archive": "Confirmation did not match.",
  duplicate: "That record already exists.",
  "duplicate_open_notice": "You already have an active move-out notice for this lease.",
  "invalid-password": "Invalid password.",
  "invalid_move_out_date": "Move-out date must be today or later.",
  "invalid_unit": "The selected unit is not available for your account.",
  "missing-password": "Required platform password is not configured.",
  "missing_fields": "Please complete the required fields.",
  "missing_move_out_date": "Please select your intended move-out date.",
  "no_active_lease": "You need an active lease to continue.",
  "not-orphan": "This record is still linked and cannot be removed.",
  "notice_submitted": "Your move-out notice has been submitted successfully.",
  password: "Password update could not be completed.",
  "root-protected": "The root administrator account cannot be changed this way.",
  "self-archive": "You cannot archive your own account.",
  "self-status": "You cannot change your own status.",
  "super-admin": "Only a super admin can perform that action.",
  tenant_not_found: "We could not verify your tenant profile.",
  username: "That username is already in use.",
};

export function getQueryMessageType(value: string | null): ActionFeedbackMessageType {
  if (!value) return "success";
  const normalized = value.trim().toLowerCase();
  if (normalized === "error" || normalized === "warning") return "error";
  return "success";
}

export function formatQueryFeedback(value: string | null | undefined) {
  if (!value) return null;

  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  decoded = decoded.replaceAll("_", " ").trim();
  if (!decoded) return null;

  return queryMessageLabels[value] ?? queryMessageLabels[decoded] ?? sentenceCase(decoded);
}

function sentenceCase(value: string) {
  const normalized = value.replaceAll("-", " ").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}.`;
}

export function completedLabel(label: string) {
  const lower = label.toLowerCase();

  if (lower === "saving") return "Saved";
  if (lower === "deleting") return "Deleted";
  if (lower === "archiving") return "Archived";
  if (lower === "restoring") return "Restored";
  if (lower === "rejecting") return "Rejected";
  if (lower === "approving") return "Approved";
  if (lower === "sending") return "Sent";
  if (lower === "updating") return "Updated";
  if (lower === "creating") return "Created";
  if (lower === "working") return "Completed";

  return "Completed";
}
