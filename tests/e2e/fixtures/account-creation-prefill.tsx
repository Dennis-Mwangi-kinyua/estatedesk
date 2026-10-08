import { createRoot } from "react-dom/client";
import { NewOrganizationWorkspace } from "../../../apps/web/src/app/(app)/platform/organizations/new/_components/new-org-workspace";
createRoot(document.getElementById("fixture")!).render(<NewOrganizationWorkspace onboardingRequestId="qualified-request" initialValues={{ organizationName: "Applicant Portfolio", organizationEmail: "applicant@example.test", organizationPhone: "+254700000000", adminFullName: "Applicant Owner", adminEmail: "applicant@example.test", adminPhone: "+254700000000" }} checkAvailability={async () => ({})} createOrganizationAction={async (_state, data) => {
  (window as unknown as { submittedRequestId: string }).submittedRequestId = String(data.get("onboardingRequestId"));
  return { success: true, createdAccount: { organizationName: String(data.get("organizationName")), slug: "applicant-portfolio", accountType: String(data.get("accountType")), fullName: String(data.get("adminFullName")), username: String(data.get("adminUsername")), email: String(data.get("adminEmail")), phone: String(data.get("adminPhone")), plan: String(data.get("plan")) } };
}} />);
