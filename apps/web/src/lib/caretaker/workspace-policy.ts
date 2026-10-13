const PERSONAL = ["", "today", "notifications", "profile", "security", "help", "broadcasts"];
const UNIT_WORK = ["units", "tenants", "leases", "documents", "water-bills", "move-outs", "handover", "finance-requests"];
export const CARETAKER_SECTIONS = [...PERSONAL, ...UNIT_WORK, "issues/new", "issues", "inspections", "vendors", "calendar", "search"];

export function caretakerWorkspaceSections(input: { hasUnits: boolean; hasIssues: boolean; hasInspections: boolean }) {
  const sections = new Set(PERSONAL);
  if (input.hasUnits) { UNIT_WORK.forEach(section => sections.add(section)); sections.add("issues/new"); }
  if (input.hasUnits || input.hasIssues) { sections.add("issues"); sections.add("vendors"); }
  if (input.hasUnits || input.hasInspections) sections.add("inspections");
  if (input.hasUnits || input.hasIssues || input.hasInspections) { sections.add("calendar"); sections.add("search"); }
  return [...sections];
}

export function caretakerCanAccessPath(pathname: string, sections: readonly string[] = CARETAKER_SECTIONS) {
  const path = new URL(pathname, "https://estatedesk.invalid").pathname.replace(/\/+$/, "");
  if (path === "/dashboard/caretaker") return sections.includes("");
  if (!path.startsWith("/dashboard/caretaker/")) return false;
  if (path === "/dashboard/caretaker/issues/new") return sections.includes("issues/new");
  const section = path.split("/")[3];
  return CARETAKER_SECTIONS.includes(section) && sections.includes(section);
}
