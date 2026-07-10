export const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-white/30";

export const labelClassName =
  "text-sm font-medium text-slate-700 dark:text-slate-200";

export function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

