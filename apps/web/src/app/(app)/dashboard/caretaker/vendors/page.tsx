import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { decodePublicId } from "@/lib/public-id";
import { VendorsWorkspace } from "./_components/vendors-workspace";
import { getCaretakerVendorsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ issueId?: string }>;
};

export default async function CaretakerVendorsPage({ searchParams }: PageProps) {
  const session = await requireCaretakerAccess();
  const resolved = (await searchParams) ?? {};
  const issueId = resolved.issueId
    ? decodePublicId(resolved.issueId, "issue")
    : undefined;

  const data = await getCaretakerVendorsData({
    orgId: session.activeOrgId!,
  });

  return <VendorsWorkspace data={data} issueId={issueId} />;
}