import { decodePublicId, encodePublicId } from "./public-id";

const VACANCY_SCOPE = "public-vacancy";
const TOKEN_SEPARATOR = "--";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function vacancyPublicSlug(input: {
  id: string;
  propertyName: string;
  houseNo: string;
}) {
  const label =
    slugify(`${input.propertyName} unit ${input.houseNo}`) || "vacancy";

  return `${label}${TOKEN_SEPARATOR}${encodePublicId(
    input.id,
    VACANCY_SCOPE
  )}`;
}

export function vacancyIdFromPublicSlug(value: string) {
  const token = value.includes(TOKEN_SEPARATOR)
    ? value.slice(value.lastIndexOf(TOKEN_SEPARATOR) + TOKEN_SEPARATOR.length)
    : value;

  try {
    return decodePublicId(token, VACANCY_SCOPE);
  } catch {
    return value;
  }
}