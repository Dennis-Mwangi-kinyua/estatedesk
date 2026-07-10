"use client";

import { useMemo, useState } from "react";

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const controls = useMemo(
    () => ({
      page,
      pageSize,
      nextPage: () => setPage((p) => p + 1),
      prevPage: () => setPage((p) => Math.max(1, p - 1)),
      setPage,
      setPageSize,
      reset: () => {
        setPage(1);
        setPageSize(initialPageSize);
      },
    }),
    [page, pageSize, initialPageSize]
  );

  return controls;
}