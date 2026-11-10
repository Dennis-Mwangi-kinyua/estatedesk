import { CrmTasks, type TaskParams } from "@/features/crm/tasks";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<TaskParams> }) { return <CrmTasks platform={false} params={await searchParams} />; }
