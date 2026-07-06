export type CreateTenantActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  credentials?: {
    tenantName: string;
    username: string;
    password: string;
  };
};