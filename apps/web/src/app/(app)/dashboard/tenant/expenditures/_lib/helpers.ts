export function formatMoney(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}

export function buildExpendituresPageHref(page: number) {
  if (page <= 1) {
    return "/dashboard/tenant/expenditures";
  }

  return `/dashboard/tenant/expenditures?page=${page}`;
}

export const fieldClassName =
  "mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm";