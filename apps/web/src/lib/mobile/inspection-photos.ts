const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export function inspectionPhotos(checklist: unknown) {
  const data = object(checklist);
  const entries = [...Object.entries(object(data.roomPhotos)), ["Site check-in", object(data.checkIn).photoAssetId] as const];
  return entries.filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0 && entry[1].length <= 200)
    .slice(0, 32).map(([label, id]) => ({ id, label: label.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").slice(0, 100) }));
}
