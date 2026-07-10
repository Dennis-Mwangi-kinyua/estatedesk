import { NextResponse } from "next/server";
import { findActiveMarketerByReferralCode } from "@/lib/marketing/referrals";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function enforceRateLimit(request: Request) {
  const result = await checkRateLimit({
    key: `marketing-referral:${getClientIp(request)}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (result.allowed) return null;

  return NextResponse.json(
    {
      error: `Too many requests. Please retry in ${result.retryAfterSeconds} seconds.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimitResponse = await enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

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
