import { prisma } from "@/lib/prisma";
import {
  publicRentalLandingPaths,
  publicRentalLocationPaths,
  rentalLocationSlug,
} from "@/lib/public-rental-seo";
import { APP_URL, buildUrlEntry, formatDate, wrapUrlset } from "@/lib/sitemap-utils";
import { vacancyPublicSlug } from "./slug";

function categorySlug(type: string) {
  switch (type) {
    case "BEDSITTER":
      return "bedsitters";
    case "STUDIO":
      return "studios";
    case "SINGLE_ROOM":
      return "single-rooms";
    case "APARTMENT":
      return "apartments";
    case "SHOP":
      return "shops";
    case "OFFICE":
      return "offices";
    case "STALL":
      return "stalls";
    case "WAREHOUSE":
      return "warehouses";
    case "GODOWN":
      return "godowns";
    default:
      return rentalLocationSlug(type);
  }
}

const publicVacantUnitWhere = {
  status: "VACANT" as const,
  isActive: true,
  deletedAt: null,
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
      property: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50_000,
  });

  const urls = units
    .map((unit) =>
      buildUrlEntry({
        loc: `${APP_URL}/vacancies/${vacancyPublicSlug({ propertyName: unit.property.name, houseNo: unit.houseNo })}`,
        lastmod: formatDate(unit.updatedAt),
        changefreq: "weekly",
        priority: "0.6",
      }),
    )
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

  const landingPages = new Map<string, string>();
  const today = formatDate(new Date());

  for (const landingPage of publicRentalLandingPaths()) {
    landingPages.set(landingPage.path, today);
  }

  for (const locationPage of publicRentalLocationPaths()) {
    landingPages.set(locationPage.path, today);
  }

  for (const unit of units) {
    const location = unit.property.location ?? unit.property.address ?? unit.property.name;
    const locationSlug = rentalLocationSlug(location);
    const unitCategorySlug = categorySlug(unit.type);

    if (!locationSlug) continue;

    const locationLoc = `/vacancies/${locationSlug}`;
    const lastmod = formatDate(unit.updatedAt);
    const existingLocationLastmod = landingPages.get(locationLoc);

    if (!existingLocationLastmod || existingLocationLastmod < lastmod) {
      landingPages.set(locationLoc, lastmod);
    }

    if (!unitCategorySlug) continue;

    const loc = `/vacancies/${locationSlug}/${unitCategorySlug}`;
    const existingLastmod = landingPages.get(loc);

    if (!existingLastmod || existingLastmod < lastmod) {
      landingPages.set(loc, lastmod);
    }
  }

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
