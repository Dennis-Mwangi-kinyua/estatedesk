import { ManagementWorkspace, type ManagementQuery } from "@/features/org-management/workspace";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<ManagementQuery> }) { return <ManagementWorkspace section="performance" query={await searchParams} />; }
