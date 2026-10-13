import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { VendorsWorkspace } from "./_components/vendors-workspace";
import { getCaretakerVendorPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";
type PageProps = { searchParams?: Promise<{ issueId?: string }> };

export default async function CaretakerVendorsPage({ searchParams }: PageProps) {
  const session = await requireCaretakerAccess();
  const resolved = (await searchParams) ?? {};
  const { data, issueId } = await getCaretakerVendorPageData(session, resolved.issueId);
  return <VendorsWorkspace data={data} issueId={issueId} />;
}
