import type { CreateOrganizationState } from "../actions";

export const initialState: CreateOrganizationState = {
  success: false,
};

export const steps = [
  { id: 1, title: "Organization" },
  { id: 2, title: "Master login" },
  { id: 3, title: "Review" },
];

export const panelClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 sm:p-6";
export const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/30";
export const iconFieldClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/30";
export const iconClass =
  "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500";
export const iconBubbleClass =
  "inline-flex rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-white/10 dark:text-slate-200";
export const helperTextClass = "mt-2 text-xs text-slate-500 dark:text-slate-400";
export const stepTitleClass = "mt-4 text-xl font-semibold text-slate-950 dark:text-white";
export const stepDescriptionClass = "mt-2 text-sm text-slate-600 dark:text-slate-300";