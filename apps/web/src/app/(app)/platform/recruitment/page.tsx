import { RecruitmentWorkspace, type HiringQuery } from "@/features/recruitment/workspace";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<HiringQuery> }) { return <RecruitmentWorkspace scope="platform" query={await searchParams} />; }
