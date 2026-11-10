import { NextResponse } from "next/server";
import { requireHiringAccess } from "@/features/recruitment/access";
import { applicantResume } from "@/features/recruitment/service";
import { RecruitmentError } from "@/features/recruitment/policy";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ scope: string; applicationId: string }> }) {
  const { scope, applicationId } = await params;
  if (scope !== "platform" && scope !== "organization") return new NextResponse(null, { status: 404 });
  const session = await requireHiringAccess(scope);
  let result;
  try { result = await applicantResume(session, scope, applicationId); } catch (error) { if (error instanceof RecruitmentError) return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } }); throw error; }
  return new NextResponse(new Uint8Array(result.resumeBytes!), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.resumeFileName || "cv.pdf")}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'", "X-Robots-Tag": "noindex, nofollow" } });
}
