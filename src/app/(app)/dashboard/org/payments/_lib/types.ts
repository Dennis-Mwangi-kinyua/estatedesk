import type { loadPaymentsPageData } from "./queries";

export type PaymentsPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export type PaymentsPageData = Awaited<ReturnType<typeof loadPaymentsPageData>>;