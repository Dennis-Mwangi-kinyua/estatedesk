import { unstable_cache } from "next/cache";
import { APP_URL, buildUrlEntry, wrapUrlset } from "@/lib/sitemap-utils";
import { PUBLIC_VACANCY_LIST_PAGE_SIZE } from "@/lib/vacancy-pagination";
import { buildVacancyPageHref } from "@/lib/vacancy-pagination";
import { getVacancyListingsCountCached } from "./listings";

async function buildVacancyListPagesXml() {
  const total = await getVacancyListingsCountCached();
  const pageCount = Math.max(1, Math.ceil(total / PUBLIC_VACANCY_LIST_PAGE_SIZE));

  const urls = Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    const path = buildVacancyPageHref("/vacancies", page);

    return buildUrlEntry({
      loc: `${APP_URL}${path}`,
      changefreq: "daily",
      priority: page === 1 ? "0.9" : "0.7",
    });
  }).join("\n");

  return wrapUrlset(urls);
}

export function getVacancyListPagesSitemapXml() {
  return unstable_cache(
    () => buildVacancyListPagesXml(),
    ["public-vacancy-list-pages-sitemap"],
    { revalidate: 300, tags: ["public-vacancies"] },
  )();
}