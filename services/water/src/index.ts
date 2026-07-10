/**
 * @estatedesk/water — service stub (Phase 1).
 * Implementation still lives in apps/web until extract.
 */
export const SERVICE = {
  name: "water",
  version: "0.1.0",
  status: "stub" as const,
} as const;

export function getHealth() {
  return {
    service: SERVICE.name,
    status: "ok" as const,
    mode: SERVICE.status,
  };
}
