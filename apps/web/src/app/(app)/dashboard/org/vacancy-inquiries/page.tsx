import { requireOrgRole } from "@/lib/permissions/guards";
import { VacancyInquiriesWorkspace } from "./_components/vacancy-inquiries-workspace";
import { getVacancyInquiriesPageData } from "./_lib/queries";
import type { VacancyInquiriesPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function VacancyInquiriesPage({
  searchParams,
}: VacancyInquiriesPageProps) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  const resolved = (await searchParams) ?? {};

  const data = await getVacancyInquiriesPageData(
    session.activeOrgId!,
    Number(resolved.page ?? "1"),
    resolved.status,
  );

  return (
    <VacancyInquiriesWorkspace data={data} orgRole={session.activeOrgRole} />
  );
}