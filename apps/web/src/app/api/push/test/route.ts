import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "Browser push notifications are disabled. Check the EstateDesk notification center." },
    { status: 410 },
  );
}
