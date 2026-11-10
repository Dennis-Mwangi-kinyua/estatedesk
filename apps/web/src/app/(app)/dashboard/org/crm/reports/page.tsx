import { CrmReports } from "@/features/crm/reports";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) { return <CrmReports platform={false} days={(await searchParams).days} />; }
