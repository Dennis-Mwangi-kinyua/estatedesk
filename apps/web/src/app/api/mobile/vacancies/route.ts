import { z } from "zod";
import { getVacancyListingsPageCached } from "@/lib/public-vacancy-listings";
import { publicVacancyImageUrl } from "@/lib/public-vacancy-image";
import { isNativeRequest, mobileJson } from "@/lib/mobile/api";

const querySchema = z.object({ q: z.string().trim().max(100).default(""), location: z.string().trim().max(100).default(""), page: z.coerce.number().int().min(1).max(1000).default(1), sort: z.enum(["location", "rent_asc", "rent_desc", "newest"]).default("location") });

export async function GET(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return mobileJson({ error: "Check your vacancy search filters." }, 400);
  const result = await getVacancyListingsPageCached({ query: parsed.data.q, location: parsed.data.location, page: parsed.data.page, pageSize: 18, sort: parsed.data.sort });
  return mobileJson({ page: result.page, total: result.total, hasMore: result.page * result.pageSize < result.total,
    items: result.items.map(row => ({ id: row.id, slug: row.publicSlug ?? row.id, title: row.property.name, subtitle: [row.building?.name, row.houseNo, row.property.location].filter(Boolean).join(" · "), type: row.type, bedrooms: row.bedrooms, rent: Number(row.rentAmount), deposit: row.depositAmount === null ? null : Number(row.depositAmount), imageUrl: publicVacancyImageUrl(row.images[0]?.key) })) });
}
