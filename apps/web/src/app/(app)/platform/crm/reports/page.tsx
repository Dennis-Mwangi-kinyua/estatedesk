import { CrmReports } from "@/features/crm/reports";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) { return <CrmReports platform days={(await searchParams).days} />; }
