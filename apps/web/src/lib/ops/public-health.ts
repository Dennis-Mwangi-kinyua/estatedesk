/** Public availability intentionally excludes infrastructure and environment diagnostics. */
export function publicHealthSummary(input: { service: string; status: "ok" | "degraded"; checkedAt: string }) {
  return { service: input.service, status: input.status, checkedAt: input.checkedAt };
}
