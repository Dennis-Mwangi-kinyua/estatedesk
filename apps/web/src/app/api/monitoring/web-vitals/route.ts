import { NextResponse } from "next/server";
import { z } from "zod";
import { PayloadTooLargeError, readBoundedJson } from "@/lib/security/bounded-json";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const webVitalSchema = z.object({
  id: z.string().max(160),
  name: z.enum(["CLS", "FCP", "FID", "INP", "LCP", "TTFB"]),
  value: z.number().nonnegative(),
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
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  let payload: unknown;
  try { payload = await readBoundedJson(request, 4096); }
  catch (error) {
    return NextResponse.json({ error: "Invalid web vital payload." }, { status: error instanceof PayloadTooLargeError ? 413 : 400 });
  }
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
  } catch {
    // Telemetry is optional: drop it during limiter outages rather than accept unlimited writes.
    return new Response(null, { status: 204 });
  }

  const parsed = webVitalSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid web vital payload." }, { status: 400 });
  }

  console.info("web-vital", parsed.data);
  return new Response(null, { status: 204 });
}
