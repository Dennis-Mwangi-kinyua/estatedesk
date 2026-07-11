import { revalidatePath, revalidateTag } from "next/cache";
import { resolvePublicListingHref, vacancyPublicSlug } from "./slug";

export const PUBLIC_VACANCIES_CACHE_TAG = "public-vacancies";

type RevalidatePublicVacanciesInput = {
  unitId?: string;
  propertyName?: string;
  houseNo?: string;
  publicSlug?: string | null;
};

export function revalidatePublicVacancies(input?: RevalidatePublicVacanciesInput) {
  revalidateTag(PUBLIC_VACANCIES_CACHE_TAG, "max");
  revalidatePath("/vacancies");
  revalidatePath("/vacancies/[location]", "page");

  if (input?.publicSlug) {
    revalidatePath(`/vacancies/${input.publicSlug}`);
  }

  if (input?.propertyName && input.houseNo) {
    const href = resolvePublicListingHref({
      publicSlug: input.publicSlug,
      propertyName: input.propertyName,
      houseNo: input.houseNo,
    });
    revalidatePath(href);

    const baseSlug = vacancyPublicSlug({
      propertyName: input.propertyName,
      houseNo: input.houseNo,
    });
    if (baseSlug !== input.publicSlug) {
      revalidatePath(`/vacancies/${baseSlug}`);
    }
  }
}