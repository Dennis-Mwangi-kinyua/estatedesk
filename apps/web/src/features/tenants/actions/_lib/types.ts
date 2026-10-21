import type { RecipientMessageDraft } from "@/lib/notifications/recipient-message";
export type CreateTenantActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  allocationDraft?: RecipientMessageDraft;
  credentials?: {
    tenantName: string;
    username: string;
    setupUrl: string;
    email: string | null;
    phone: string;
    loginUrl: string;
  };
};