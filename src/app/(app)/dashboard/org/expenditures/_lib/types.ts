import type { loadOrgExpendituresPageData } from "./queries";

export const PAGE_SIZE = 20;

export const EXPENDITURE_CATEGORIES = [
  "MAINTENANCE",
  "UTILITIES",
  "ADMINISTRATION",
  "MARKETING",
  "STAFF",
  "TAX",
  "INSURANCE",
  "LEGAL",
  "SOFTWARE",
  "TRANSPORT",
  "TENANT_REPAIR",
  "TENANT_SERVICE",
  "OTHER",
] as const;

export type ExpendituresSearchParams = {
  page?: string;
};

export type ExpendituresPageProps = {
  searchParams?: Promise<ExpendituresSearchParams>;
};

export type OrgExpendituresPageData = Awaited<
  ReturnType<typeof loadOrgExpendituresPageData>
>;