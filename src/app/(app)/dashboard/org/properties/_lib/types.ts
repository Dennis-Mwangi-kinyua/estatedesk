import type { PropertyType } from "@prisma/client";
import type { loadPropertiesPageData } from "./queries";

export const PAGE_SIZE = 8;

export const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MIXED_USE", label: "Mixed use" },
  { value: "GODOWN", label: "Godown" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  { value: "inactive", label: "Inactive only" },
] as const;

export type PropertiesSearchParams = {
  created?: string;
  q?: string;
  type?: string;
  status?: string;
  page?: string;
};

export type PropertiesPageProps = {
  searchParams?: Promise<PropertiesSearchParams>;
};

export type PropertiesPageData = Awaited<ReturnType<typeof loadPropertiesPageData>>;