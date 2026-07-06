import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  buildVacancyPageHref,
  buildVacancyPagination,
  PUBLIC_VACANCY_LIST_PAGE_SIZE,
} from "@/lib/vacancy-pagination";

type VacancyListMetadataInput = {
  page: number;
  totalItems: number;
  title: string;
  description: string;
  path: string;
  filterParams?: Record<string, string | undefined>;
};

export function vacancyListPaginationMetadata({
  page,
  totalItems,
  title,
  description,
  path,
  filterParams = {},
}: VacancyListMetadataInput): Pick<Metadata, "alternates" | "pagination"> {
  const pagination = buildVacancyPagination(
    totalItems,
    page,
    PUBLIC_VACANCY_LIST_PAGE_SIZE,
  );

  const canonical = absoluteUrl(path);
  const previous =
    pagination.currentPage > 1
      ? absoluteUrl(
          buildVacancyPageHref("/vacancies", pagination.currentPage - 1, filterParams),
        )
      : undefined;
  const next =
    pagination.currentPage < pagination.pageCount
      ? absoluteUrl(
          buildVacancyPageHref("/vacancies", pagination.currentPage + 1, filterParams),
        )
      : undefined;

  return {
    alternates: {
      canonical,
      languages: {
        "en-KE": canonical,
        "x-default": canonical,
      },
    },
    pagination: {
      previous,
      next,
    },
  };
}