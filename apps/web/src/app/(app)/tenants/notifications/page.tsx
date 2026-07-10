import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

export default async function LegacyTenantNotificationsPage({
  searchParams,
}: PageProps) {
  const filter = (await searchParams)?.filter;
  const suffix = filter ? `?filter=${encodeURIComponent(filter)}` : "";
  redirect(`/dashboard/tenant/notifications${suffix}`);
}