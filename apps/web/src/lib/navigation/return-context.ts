import { safeReturnTo } from "../auth/safe-return-to";

const filters = new Set(["q", "page", "pageSize", "status", "role", "organization", "category", "location", "tab", "filter", "sort", "online", "queuedPage", "failedPage", "kraPage"]);
export function directoryContext(path: string, query: string) {
  const result = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(query)) if (filters.has(key) && value.length <= 200) result.set(key, value);
  return `${path}${result.size ? `?${result}` : ""}`;
}
export function directoryReturn(currentPath: string, destination: string, stored: string | null) {
  if (destination.includes("?") || destination.includes("#") || !currentPath.startsWith(`${destination}/`)) return null;
  const safe = safeReturnTo(stored);
  if (!safe || new URL(safe, "https://estatedesk.invalid").pathname !== destination) return null;
  return safe;
}
