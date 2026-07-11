/**
 * Public vacancy service — in-process library (Phase 1).
 * Future: standalone HTTP process owning public listing read models.
 */
export const PUBLIC_VACANCY_SERVICE = {
  name: "public-vacancy",
  version: "0.1.0",
  status: "in-process" as const,
  owns: [
    "public listings",
    "vacancy SEO/sitemaps",
    "vacancy OG resolution",
  ],
} as const;

export * from "./cache";
export * from "./ensure-slug";
export * from "./image";
export * from "./list-sitemap";
export * from "./listings";
export * from "./resolve";
export * from "./sitemap";
export * from "./slug";
export * from "./slug-index";
export * from "./where";

export function getPublicVacancyHealth() {
  return {
    service: PUBLIC_VACANCY_SERVICE.name,
    status: "ok" as const,
    mode: PUBLIC_VACANCY_SERVICE.status,
  };
}
