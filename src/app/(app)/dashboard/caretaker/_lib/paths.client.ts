/** Client-safe caretaker path helpers (no Node crypto / public-id encoding). */

export function getCaretakerSearchHref(query = "") {
  const trimmed = query.trim();
  return trimmed
    ? `/dashboard/caretaker/search?q=${encodeURIComponent(trimmed)}`
    : "/dashboard/caretaker/search";
}