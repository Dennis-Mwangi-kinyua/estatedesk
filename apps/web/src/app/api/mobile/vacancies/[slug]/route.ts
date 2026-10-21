import { resolveVacancyUnitIdFromSlug } from "@/lib/public-vacancy-resolve";
import { publicListedVacancyWhere } from "@estatedesk/public-vacancy/where";
import { publicVacancyImageUrl } from "@/lib/public-vacancy-image";
import { isNativeRequest, mobileJson } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  const { slug } = await context.params;
  if (!slug || slug.length > 200) return mobileJson({ error: "Vacancy not found." }, 404);
  const id = await resolveVacancyUnitIdFromSlug(slug);
  if (!id) return mobileJson({ error: "This vacancy is no longer available." }, 404);
  const row = await prisma.unit.findFirst({ where: { id, ...publicListedVacancyWhere }, select: { id: true, houseNo: true, type: true, bedrooms: true, bathrooms: true, rentAmount: true, depositAmount: true, serviceCharge: true, viewingFeeRequired: true, viewingFeeAmount: true, notes: true, publicSlug: true, images: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, take: 1, select: { key: true } }, building: { select: { name: true } }, property: { select: { name: true, location: true, address: true, org: { select: { name: true } } } } } });
  if (!row) return mobileJson({ error: "This vacancy is no longer available." }, 404);
  return mobileJson({ id: row.id, slug: row.publicSlug ?? row.id, title: row.property.name, subtitle: [row.building?.name, row.houseNo, row.property.location].filter(Boolean).join(" · "), type: row.type, bedrooms: row.bedrooms, rent: Number(row.rentAmount), deposit: row.depositAmount === null ? null : Number(row.depositAmount), imageUrl: publicVacancyImageUrl(row.images[0]?.key), description: row.notes ?? "Contact the property team to learn more about this home.", location: row.property.location ?? "", address: row.property.address, bathrooms: row.bathrooms, serviceCharge: row.serviceCharge === null ? null : Number(row.serviceCharge), viewingFee: row.viewingFeeRequired ? Number(row.viewingFeeAmount) : null, organization: row.property.org.name });
}
