import { NextResponse } from "next/server";
import { getWebPushPublicKey, isWebPushConfigured } from "@/lib/push/web-push";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isWebPushConfigured()) {
    return NextResponse.json({
      enabled: false,
      publicKey: "",
    });
  }

  return NextResponse.json({
    enabled: true,
    publicKey: getWebPushPublicKey(),
  });
}
