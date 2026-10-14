/** Keep report return links inside the viewer's permitted workspace. */
export function inspectionDetailHref(role: string | null, encodedId: string) {
  if (role === "TENANT") return `/dashboard/tenant/inspections/${encodedId}`;
  if (role === "CARETAKER") return `/dashboard/caretaker/inspections/${encodedId}`;
  if (["ADMIN", "MANAGER", "OFFICE"].includes(role ?? "")) return `/dashboard/org/inspections/${encodedId}`;
  return "/dashboard";
}
