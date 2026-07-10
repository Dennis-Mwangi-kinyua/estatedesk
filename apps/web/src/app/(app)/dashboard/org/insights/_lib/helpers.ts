import type { InsightSeverity } from "@/features/insights/lib/smart-insights";

export function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-700 dark:text-emerald-200";
  if (score >= 60) return "text-amber-700 dark:text-amber-200";
  return "text-red-700 dark:text-red-200";
}

export function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-600 dark:bg-emerald-500";
  if (score >= 60) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-600 dark:bg-red-500";
}

export const severityClasses: Record<InsightSeverity, string> = {
  CRITICAL:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
  HIGH:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  MEDIUM:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
  LOW:
    "border-border bg-muted/20 text-muted-foreground dark:border-border dark:bg-muted/15",
};