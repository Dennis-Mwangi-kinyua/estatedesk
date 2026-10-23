import { getUserSession } from "@/lib/auth/session";
import { liveListener } from "@/lib/realtime/listener";
import { matchesLiveScope } from "@/lib/realtime/scope";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const session = await getUserSession();
  if (!session) return new Response(null, { status: 401 });
  if (session.mustChangePassword || session.requiresTermsAcceptance) return new Response(null, { status: 403 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  const workspace = new URL(request.url).searchParams.get("workspace");
  const provider = workspace === "provider" ? await prisma.serviceProvider.findUnique({ where: { userId: session.userId }, select: { status: true } }) : null;
  const scope = { ...session, platformRole: workspace === "platform" ? session.platformRole : "NONE", provider: provider?.status === "ACTIVE" };

  let release: (() => void) | undefined;
  let finish = () => {};
  let emit: (event: string) => void = () => {};
  // Establish LISTEN before sending ready, so the client's reconciliation read
  // covers any changes that happened while the connection was being opened.
  try {
    release = await liveListener.subscribe({
      change: payload => { if (matchesLiveScope(payload, scope)) emit("change"); },
      disconnected: () => finish(),
    });
  } catch {
    return new Response(null, { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      finish = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat); clearTimeout(expiry);
        request.signal.removeEventListener("abort", finish);
        release?.();
        try { controller.close(); } catch { /* The consumer may already have cancelled. */ }
      };
      emit = event => { if (!closed) controller.enqueue(encoder.encode(`event: ${event}\ndata: {}\n\n`)); };
      const heartbeat = setInterval(() => { if (!closed) controller.enqueue(encoder.encode(": heartbeat\n\n")); }, 15000);
      // Reconnect requires fresh authentication and membership resolution.
      const expiry = setTimeout(finish, 50000);
      request.signal.addEventListener("abort", finish, { once: true });
      if (request.signal.aborted) finish(); else emit("ready");
    },
    cancel() { finish(); },
  });
  return new Response(body, { headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff",
  } });
}
