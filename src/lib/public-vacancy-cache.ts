import { revalidatePath, revalidateTag } from "next/cache";
import { vacancyPublicSlug } from "@/lib/public-vacancy-slug";

export const PUBLIC_VACANCIES_CACHE_TAG = "public-vacancies";

type RevalidatePublicVacanciesInput = {
  unitId?: string;
  propertyName?: string;
  houseNo?: string;
};

export function revalidatePublicVacancies(input?: RevalidatePublicVacanciesInput) {
  revalidateTag(PUBLIC_VACANCIES_CACHE_TAG, "max");
  revalidatePath("/vacancies");
  revalidatePath("/vacancies/[location]", "page");

  if (input?.unitId && input.propertyName && input.houseNo) {
    const slug = vacancyPublicSlug({
      propertyName: input.propertyName,
      houseNo: input.houseNo,
    });
    revalidatePath(`/vacancies/${slug}`);
  }
}