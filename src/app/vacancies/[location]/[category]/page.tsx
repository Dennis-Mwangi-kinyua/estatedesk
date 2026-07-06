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

import { PUBLIC_VACANCY_REVALIDATE_SECONDS } from "@/lib/public-vacancy-listings";

export const revalidate = PUBLIC_VACANCY_REVALIDATE_SECONDS;

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

  return (
    <VacanciesPage
      searchParams={Promise.resolve({
        q: categorySearchTerm(category),
        location: locationLabel(location),
      })}
    />
  );
}
