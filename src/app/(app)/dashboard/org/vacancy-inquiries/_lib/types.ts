export const PAGE_SIZE = 20;

export const INQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "VIEWING_SCHEDULED",
  "CONVERTED",
  "CLOSED",
] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export type VacancyInquiriesPageProps = {
  searchParams?: Promise<{ page?: string; status?: string }>;
};