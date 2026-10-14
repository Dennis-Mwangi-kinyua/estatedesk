import { NextResponse } from "next/server";
import { getUpdateNotice } from "@/features/platform-updates/service";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await getUpdateNotice(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json(null, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
