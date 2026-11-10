import { RecruitmentWorkspace, type HiringQuery } from "@/features/recruitment/workspace";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ jobId: string }>; searchParams: Promise<HiringQuery> }) { return <RecruitmentWorkspace scope="organization" jobId={(await params).jobId} query={await searchParams} />; }
