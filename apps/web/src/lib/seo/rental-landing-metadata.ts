import { getVacancyListingsCountCached } from "@/lib/public-vacancy-listings";
import { locationLabel } from "@/lib/public-rental-seo";
import { rentalCategoryType } from "./rental-inventory";

export async function rentalLandingRobots(location: string, category?: string) {
  try {
    const count = await getVacancyListingsCountCached({ location: locationLabel(location), type: category ? rentalCategoryType(category) : undefined });
    return { index: count > 0, follow: true };
  } catch {
    return { index: false, follow: true };
  }
}
