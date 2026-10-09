import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAuthenticatedUserId() {
  const session = await getUserSession();
  return session?.userId ?? null;
}

export async function POST() {
  return NextResponse.json(
    { error: "Browser push notifications are disabled." },
    { status: 410 },
  );
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = z
    .object({ endpoint: z.string().url() })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid push subscription." },
      { status: 400 },
    );
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint: parsed.data.endpoint,
    },
  });

  return NextResponse.json({ ok: true });
}
