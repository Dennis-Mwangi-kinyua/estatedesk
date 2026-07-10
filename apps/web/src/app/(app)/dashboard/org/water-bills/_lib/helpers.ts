import { encodePublicId } from "@/lib/public-id";

/** Short human-facing reading reference, e.g. WR-A3F2K9 */
export function formatWaterReadingRef(readingId: string) {
  const compact = readingId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tail = compact.slice(-6) || "000000";
  return `WR-${tail}`;
}

export function getOrgWaterReadingHref(readingId: string) {
  return `/dashboard/org/water-bills/readings/${encodePublicId(readingId, "meter-reading")}`;
}
