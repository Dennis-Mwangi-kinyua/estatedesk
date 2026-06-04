export type ActionFeedbackMessageType = "success" | "error";

export function getQueryMessageType(value: string | null): ActionFeedbackMessageType {
  if (!value) return "success";
  const normalized = value.trim().toLowerCase();
  if (normalized === "error" || normalized === "warning") return "error";
  return "success";
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
