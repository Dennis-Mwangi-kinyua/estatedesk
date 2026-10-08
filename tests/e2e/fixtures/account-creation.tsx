import { createRoot } from "react-dom/client";
import { NewOrganizationWorkspace } from "../../../apps/web/src/app/(app)/platform/organizations/new/_components/new-org-workspace";

let attempt = 0;
createRoot(document.getElementById("fixture")!).render(<NewOrganizationWorkspace checkAvailability={async (values) => values.organizationName === "Reserved agency" ? { organizationName: ["This workspace name is already in use."] } : {}} createOrganizationAction={async (_state, data) => {
  attempt += 1;
  if (attempt === 1) return { success: false, error: "That username is already in use.", fieldErrors: { adminUsername: ["Choose another username."] } };
  return { success: true, createdAccount: { organizationName: String(data.get("organizationName")), slug: "test-agency", accountType: String(data.get("accountType")), fullName: String(data.get("adminFullName")), username: String(data.get("adminUsername")), email: String(data.get("adminEmail")), phone: null, plan: String(data.get("plan")) } };
}} />);
