export const PUBLIC_VACANCY_LIST_PAGE_SIZE = 12;
export const PUBLIC_VACANCY_RELATED_PAGE_SIZE = 8;

export type VacancyPaginationState = {
  currentPage: number;
  pageCount: number;
  total: number;
  pageSize: number;
  start: number;
  end: number;
};

export function parsePositiveInt(value: string | undefined, fallback = 1) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseOptionalPositiveInt(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return parsed;
}

export function parseOptionalNonNegativeNumber(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function buildVacancyPagination(
  total: number,
  page: number,
  pageSize: number,
): VacancyPaginationState {
  const pageCount = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    pageCount,
    total,
    pageSize,
    start,
    end: Math.min(start + pageSize, total),
  };
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const pagination = buildVacancyPagination(items.length, page, pageSize);
  return {
    pagination,
    items: items.slice(pagination.start, pagination.end),
  };
}

type SearchParamValue = string | number | undefined | null;

export function buildVacancyPageHref(
  basePath: string,
  page: number,
  params: Record<string, SearchParamValue> = {},
  pageParam = "page",
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "" || key === pageParam) continue;
    search.set(key, String(value));
  }

  if (page > 1) {
    search.set(pageParam, String(page));
  }

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
