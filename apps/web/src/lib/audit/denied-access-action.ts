/** Background route loading is not evidence that a person tried to open a page. */
export function deniedAccessAction(headers: Pick<Headers, "get">) {
  // Submitted server actions must always retain the normal denied-access event.
  if (headers.get("next-action")) return "ACCESS_DENIED";
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""}`;
  const prefetch = headers.get("next-router-prefetch") === "1"
    || /\bprefetch\b/i.test(purpose);
  return prefetch ? "ACCESS_PREFETCH_DENIED" : "ACCESS_DENIED";
}
