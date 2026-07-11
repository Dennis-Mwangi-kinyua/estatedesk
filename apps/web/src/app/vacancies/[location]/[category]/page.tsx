import type { Metadata } from "next";
import VacanciesPage from "@/app/(marketing)/vacancies/page";
import { publicPageMetadata } from "@/lib/seo";
import {
  buildRentalLandingDescription,
  buildRentalLandingTitle,
  categorySearchTerm,
  locationLabel,
  publicRentalLandingPaths,
} from "@/lib/public-rental-seo";

type PageProps = {
  params: Promise<{
    location: string;
    category: string;
  }>;
};

export const revalidate = 300;

function categoryToUnitType(category: string) {
  switch (category.toLowerCase()) {
    case "bedsitters":
      return "BEDSITTER";
    case "studios":
      return "STUDIO";
    case "single-rooms":
      return "SINGLE_ROOM";
    case "apartments":
      return "APARTMENT";
    case "shops":
      return "SHOP";
    case "offices":
      return "OFFICE";
    case "stalls":
      return "STALL";
    case "warehouses":
      return "WAREHOUSE";
    case "godowns":
      return "GODOWN";
    default:
      return undefined;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location, category } = await params;

  return publicPageMetadata({
    title: buildRentalLandingTitle(location, category),
    description: buildRentalLandingDescription(location, category),
    path: `/vacancies/${location}/${category}`,
    keywords: [
      `${categorySearchTerm(category)} in ${locationLabel(location)}`,
      `${categorySearchTerm(category)} for rent in ${locationLabel(location)}`,
      `vacant ${categorySearchTerm(category)} ${locationLabel(location)}`,
      `houses for rent ${locationLabel(location)}`,
    ],
  });
}

export function generateStaticParams() {
  return publicRentalLandingPaths().map(({ location, category }) => ({
    location,
    category,
  }));
}

export default async function VacancySearchLandingPage({ params }: PageProps) {
  const { location, category } = await params;
  const type = categoryToUnitType(category);

  return (
    <VacanciesPage
      searchParams={Promise.resolve({
        // Prefer structured type filter; keep q for SEO keyword match fallback.
        q: type ? undefined : categorySearchTerm(category),
        location: locationLabel(location),
        type,
      })}
    />
  );
}
