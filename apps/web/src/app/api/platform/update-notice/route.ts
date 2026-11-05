import { NextResponse } from "next/server";
import { getUpdateNotice } from "@/features/platform-updates/service";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getUpdateNotice(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // Log identifiers only: database errors can include connection credentials
    // or query details in their message, stack and metadata.
    console.error("Public update notice lookup failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: error && typeof error === "object" && "code" in error
        && typeof error.code === "string" ? error.code : undefined,
    });
    return NextResponse.json(null, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }
}
