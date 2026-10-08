import { DestructiveActionGuard } from "../../../apps/web/src/components/shared/destructive-action-guard";
import { createRoot } from "react-dom/client";
import { OnboardingRequestCard } from "../../../apps/web/src/app/(app)/platform/onboarding/_components/onboarding-request-card";
const request = { id: "request-new", companyName: "Greenview Properties", fullName: "Jane Example", workEmail: "jane@example.test", phone: "+254700000000", managedPropertyType: "Residential apartments", message: "We need help setting up our portfolio.", internalNotes: null, status: "NEW", createdAt: "2026-10-08T07:00:00.000Z", handledAt: null, handledBy: null, referral: null };
createRoot(document.getElementById("fixture")!).render(<div className="space-y-4"><DestructiveActionGuard /><OnboardingRequestCard request={request} /><OnboardingRequestCard request={{ ...request, id: "request-qualified", companyName: "Qualified Portfolio", status: "QUALIFIED" }} /></div>);
