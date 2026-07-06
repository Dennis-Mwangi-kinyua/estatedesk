import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { resolveIssueCreatePath } from "@/lib/issues/share-routing";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    title?: string;
    description?: string;
    propertyId?: string;
    unitId?: string;
    shared?: string;
  }>;
};

export default async function IssueCreateAliasPage({ searchParams }: PageProps) {
  const session = await getUserSession();
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const search = query.size > 0 ? `?${query.toString()}` : "";

  if (!session?.userId) {
    redirect(`/login?next=${encodeURIComponent(`/issues/new${search}`)}`);
  }

  redirect(
    resolveIssueCreatePath({
      role: session.activeOrgRole,
      search,
    }),
  );
}