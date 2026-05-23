import { NextResponse } from "next/server";
import { findActiveMarketerByReferralCode } from "@/lib/marketing/referrals";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const marketer = await findActiveMarketerByReferralCode(
    prisma,
    decodeURIComponent(code),
  );

  if (!marketer) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    marketer: {
      fullName: marketer.fullName,
      referralCode: marketer.referralCode,
    },
  });
}
