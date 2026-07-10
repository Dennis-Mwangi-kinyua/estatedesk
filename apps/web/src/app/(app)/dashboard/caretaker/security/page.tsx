import { SecurityWorkspace } from "./_components/security-workspace";
import { getCaretakerSecurityData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerSecurityPage() {
  const data = await getCaretakerSecurityData();

  return <SecurityWorkspace data={data} />;
}