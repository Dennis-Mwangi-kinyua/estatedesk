import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LegacyTenantsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function LegacyTenantsPage({
  searchParams,
}: LegacyTenantsPageProps) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status?.trim()) {
    query.set("status", params.status.trim());
  }

  if (params.page?.trim()) {
    query.set("page", params.page.trim());
  }

  const qs = query.toString();
  redirect(qs ? `/dashboard/org/tenants?${qs}` : "/dashboard/org/tenants");
}