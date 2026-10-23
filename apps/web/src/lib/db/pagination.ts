export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export function getPagination(input?: PaginationInput) {
  const positiveInteger = (value: number | undefined, fallback: number) =>
    value === undefined || !Number.isFinite(value)
      ? fallback
      : Math.max(1, Math.trunc(value));
  const pageSize = Math.min(100, positiveInteger(input?.pageSize, 20));
  // Prisma pagination uses signed 32-bit offsets. Bound the page before multiplying.
  const maxPage = Math.floor(2_147_483_647 / pageSize) + 1;
  const page = Math.min(maxPage, positiveInteger(input?.page, 1));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
