import { notFound } from "next/navigation";
import { rentalLandingRobots } from "@/lib/seo/rental-landing-metadata";
import { rentalCategoryType } from "@/lib/seo/rental-inventory";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location, category } = await params;

  if (!rentalCategoryType(category)) notFound();
  return { ...publicPageMetadata({
    title: buildRentalLandingTitle(location, category),
    description: buildRentalLandingDescription(location, category),
    path: `/vacancies/${location}/${category}`,
    keywords: [
      `${categorySearchTerm(category)} in ${locationLabel(location)}`,
      `${categorySearchTerm(category)} for rent in ${locationLabel(location)}`,
      `vacant ${categorySearchTerm(category)} ${locationLabel(location)}`,
      `houses for rent ${locationLabel(location)}`,
    ],
  }), robots: await rentalLandingRobots(location, category) };
}

export function generateStaticParams() {
  return publicRentalLandingPaths().map(({ location, category }) => ({
    location,
    category,
  }));
}

export default async function VacancySearchLandingPage({ params }: PageProps) {
  const { location, category } = await params;
  const type = rentalCategoryType(category);
  if (!type) notFound();

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
