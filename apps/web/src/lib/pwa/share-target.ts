export function buildShareTargetQuery(input: {
  title?: string | null;
  text?: string | null;
  url?: string | null;
}) {
  const title = input.title?.trim().slice(0, 200) ?? "";
  const text = input.text?.trim().slice(0, 2000) ?? "";
  const url = input.url?.trim().slice(0, 500) ?? "";
  const description = [text, url].filter(Boolean).join("\n\n");
  const params = new URLSearchParams();

  if (title) {
    params.set("title", title);
  }

  if (description) {
    params.set("description", description);
  }

  if (params.size === 0) {
    return "";
  }

  return `?${params.toString()}`;
}