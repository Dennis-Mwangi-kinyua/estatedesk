import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserSession } from "@/lib/auth/session";
import { sendTestPushToUser } from "@/lib/push/send-test-push";
import { isWebPushConfigured } from "@/lib/push/web-push";

export const dynamic = "force-dynamic";

const testPushSchema = z.object({
  url: z.string().startsWith("/").max(500).optional(),
});

export async function POST(request: Request) {
  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { error: "Web Push is not configured." },
      { status: 503 },
    );
  }

  const session = await getUserSession();

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = testPushSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid test push request." },
      { status: 400 },
    );
  }

  try {
    const result = await sendTestPushToUser({
      userId: session.userId,
      url: parsed.data.url ?? "/dashboard",
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Test alert could not be sent.",
      },
      { status: 400 },
    );
  }
}