import { prisma } from "@/lib/prisma";
import { rentalInventorySitemapEntries } from "@/lib/seo/rental-inventory";
import { APP_URL, buildUrlEntry, formatDate, wrapUrlset } from "@/lib/sitemap-utils";
import { vacancyPublicSlug } from "./slug";

const publicVacantUnitWhere = {
  status: "VACANT" as const,
  isActive: true,
  deletedAt: null,
  isPubliclyListed: true,
  property: {
    isActive: true,
    deletedAt: null,
    org: {
      status: "ACTIVE" as const,
      deletedAt: null,
    },
  },
};

export async function buildVacancyDetailSitemapXml() {
  const units = await prisma.unit.findMany({
    where: publicVacantUnitWhere,
    select: {
      id: true,
      updatedAt: true,
      houseNo: true,
      publicSlug: true,
      property: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50_000,
  });

  const urls = units
    .map((unit) => {
      const slug =
        unit.publicSlug?.trim() ||
        vacancyPublicSlug({
          propertyName: unit.property.name,
          houseNo: unit.houseNo,
        });

      return buildUrlEntry({
        loc: `${APP_URL}/vacancies/${slug}`,
        lastmod: formatDate(unit.updatedAt),
        changefreq: "weekly",
        priority: "0.6",
      });
    })
    .join("\n");

  return wrapUrlset(urls);
}

export async function buildRentalLandingSitemapXml() {
  const units = await prisma.unit.findMany({
    where: publicVacantUnitWhere,
    select: {
      type: true,
      updatedAt: true,
      property: {
        select: {
          location: true,
          address: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50_000,
  });

  const landingPages = rentalInventorySitemapEntries(units);

  const urls = Array.from(landingPages.entries())
    .map(([loc, lastmod]) =>
      buildUrlEntry({
        loc: `${APP_URL}${loc}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.7",
      }),
    )
    .join("\n");

  return wrapUrlset(urls);
}
