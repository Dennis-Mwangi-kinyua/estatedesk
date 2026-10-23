import { WORKFLOW_PROTOCOL_VERSION } from "@estatedesk/contracts/mobile";
import { mobileJson } from "@/lib/mobile/api";
export async function GET() {
  return mobileJson({ workflowVersion: WORKFLOW_PROTOCOL_VERSION, features: ["review-queue", "submission-receipts", "organization-user-groups"] });
}
