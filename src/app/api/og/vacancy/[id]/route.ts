import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function enforceRateLimit(request: Request) {
  const result = await checkRateLimit({
    key: `og-vacancy:${getClientIp(request)}`,
    limit: 120,
    windowMs: 60_000,
  });

  if (result.allowed) return null;

  return new Response("Too many requests", {
    status: 429,
    headers: {
      "Retry-After": String(result.retryAfterSeconds),
    },
  });
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimitResponse = await enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await context.params;

  const unit = await prisma.unit.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
      status: "VACANT",
      property: {
        isActive: true,
        deletedAt: null,
      },
    },
    include: { property: { select: { name: true, address: true } } },
  });

  if (!unit) return new Response("Not found", { status: 404 });

  const title = `${unit.property?.name ?? "Property"} - ${unit.houseNo}`;
  const desc = `${unit.bedrooms ?? ""} BR - ${unit.type.toLowerCase()} - ${unit.property?.name ?? ""}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="100%" height="100%" fill="#0ea5a4" />
    <g fill="#fff" font-family="Inter, Arial, sans-serif">
      <text x="64" y="120" font-size="48" font-weight="700">EstateDesk</text>
      <text x="64" y="220" font-size="40" font-weight="600">${escapeXml(title)}</text>
      <text x="64" y="280" font-size="28">${escapeXml(desc)}</text>
      <rect x="64" y="320" width="520" height="220" rx="16" fill="#ffffff" opacity="0.08" />
    </g>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "s-maxage=86400",
    },
  });
}

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
