export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export function getPagination(input?: PaginationInput) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 20));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}