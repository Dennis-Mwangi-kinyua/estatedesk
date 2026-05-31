import type { Metadata } from "next";
import VacanciesPage from "@/app/(marketing)/vacancies/page";
import { publicPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{
    location: string;
    category: string;
  }>;
};

function titleCaseSegment(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function categorySearchTerm(category: string) {
  const normalized = category.toLowerCase().replace(/-/g, " ");

  if (normalized === "bedsitter") return "bedsitters";
  if (normalized === "studio") return "studios";
  if (normalized === "single room") return "single rooms";
  if (normalized === "apartment") return "apartments";

  return normalized;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location, category } = await params;
  const locationLabel = titleCaseSegment(location);
  const categoryLabel = titleCaseSegment(categorySearchTerm(category));

  return publicPageMetadata({
    title: `${categoryLabel} in ${locationLabel}`,
    description: `Find vacant ${categorySearchTerm(category)} in ${locationLabel} on EstateDesk with rent, unit details, viewing information, and manager contacts.`,
    path: `/vacancies/${location}/${category}`,
  });
}

export default async function VacancySearchLandingPage({ params }: PageProps) {
  const { location, category } = await params;

  return (
    <VacanciesPage
      searchParams={Promise.resolve({
        q: categorySearchTerm(category),
        location: titleCaseSegment(location),
      })}
    />
  );
}
