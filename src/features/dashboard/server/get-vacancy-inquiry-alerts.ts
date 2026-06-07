import { prisma } from "@/lib/prisma";

export type VacancyInquiryAlert = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  message: string;
  createdAt: string;
  unitId: string;
  unitLabel: string;
  propertyName: string;
  propertyLocation: string | null;
};

export async function getVacancyInquiryAlerts(
  orgId: string,
): Promise<VacancyInquiryAlert[]> {
  const inquiries = await prisma.vacancyInquiry.findMany({
    where: {
      orgId,
      status: "NEW",
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      message: true,
      createdAt: true,
      unitId: true,
      unit: {
        select: {
          houseNo: true,
          property: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return inquiries.map((inquiry) => ({
    id: inquiry.id,
    fullName: inquiry.fullName,
    phone: inquiry.phone,
    email: inquiry.email,
    message: inquiry.message,
    createdAt: inquiry.createdAt.toISOString(),
    unitId: inquiry.unitId,
    unitLabel: inquiry.unit.houseNo,
    propertyName: inquiry.unit.property.name,
    propertyLocation: inquiry.unit.property.location,
  }));
}
