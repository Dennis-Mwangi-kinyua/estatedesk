import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserSession } from "@/lib/auth/session";
import { logServerError } from "@/lib/errors/server-error-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { PayloadTooLargeError, readBoundedJson } from "@/lib/security/bounded-json";

export const dynamic = "force-dynamic";

const clientErrorSchema = z.object({
  context: z.string().trim().min(1).max(120),
  digest: z.string().trim().max(64).optional(),
  path: z.string().trim().max(300).optional(),
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
  const session = await getUserSession();

  if (!session?.userId) {
    // Public error boundaries also report here. Drop anonymous telemetry
    // without creating another browser error or writing unauthenticated logs.
    return new Response(null, { status: 204 });
  }

  try {
    const limiter = await checkRateLimit({
      key: `client-errors:${getClientIp(request)}:${session.userId}`,
      limit: 30,
      windowMs: 60_000,
    });

    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many error reports." }, { status: 429 });
    }
  } catch (error) {
    logServerError("client-errors.rate-limit", error);
    // Optional telemetry must not bypass the limiter during an outage.
    return new Response(null, { status: 204 });
  }

  let payload: unknown;
  try {
    payload = await readBoundedJson(request, 4096);
  } catch (error) {
    return NextResponse.json({ error: "Invalid client error payload." }, {
      status: error instanceof PayloadTooLargeError ? 413 : 400,
    });
  }
  const parsed = clientErrorSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid client error payload." }, { status: 400 });
  }

  logServerError("client.ui", new Error("Client route error"), {
    userId: session.userId,
    orgId: session.activeOrgId,
    context: parsed.data.context,
    digest: parsed.data.digest,
    path: parsed.data.path,
  });

  return new Response(null, { status: 204 });
}
