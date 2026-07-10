import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const webVitalSchema = z.object({
  id: z.string().max(160),
  name: z.string().max(40),
  value: z.number(),
  rating: z.string().max(40).optional(),
  delta: z.number().optional(),
  navigationType: z.string().max(80).optional(),
  path: z.string().max(300).optional(),
});

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    const limiter = await checkRateLimit({
      key: `web-vitals:${getClientIp(request)}`,
      limit: 120,
      windowMs: 60_000,
    });

    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many web vital reports." },
        {
          status: 429,
          headers: { "Retry-After": String(limiter.retryAfterSeconds) },
        },
      );
    }
  } catch (error) {
    console.warn("web-vitals rate limit skipped:", error);
  }

  const parsed = webVitalSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid web vital payload." }, { status: 400 });
  }

  console.info("web-vital", parsed.data);
  return new Response(null, { status: 204 });
}
