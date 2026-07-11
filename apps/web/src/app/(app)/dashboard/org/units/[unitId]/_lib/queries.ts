import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUnitSlug } from "@/lib/units/url";

export async function getUnitDetailsData(orgId: string, requestedUnitRef: string) {
  const directUnit = await prisma.unit.findFirst({
    where: {
      id: requestedUnitRef,
      deletedAt: null,
      property: {
        orgId: orgId,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      houseNo: true,
      property: {
        select: {
          name: true,
        },
      },
      building: {
        select: {
          name: true,
        },
      },
    },
  });

  let resolvedUnitId = directUnit?.id ?? null;

  if (!resolvedUnitId) {
    const candidateUnits = await prisma.unit.findMany({
      where: {
        deletedAt: null,
        property: {
          orgId: orgId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        houseNo: true,
        property: {
          select: {
            name: true,
          },
        },
        building: {
          select: {
            name: true,
          },
        },
      },
    });

    const slugMatch = candidateUnits.find((unit) => {
      return (
        getUnitSlug({
          id: unit.id,
          houseNo: unit.houseNo,
          buildingName: unit.building?.name,
          propertyName: unit.property.name,
        }) === requestedUnitRef
      );
    });

    resolvedUnitId = slugMatch?.id ?? null;
  }

  if (!resolvedUnitId) {
    notFound();
  }

  const organization = await prisma.organization.findFirst({
    where: {
      id: orgId,
      deletedAt: null,
    },
    select: {
      currencyCode: true,
      name: true,
    },
  });

  const currencyCode = organization?.currencyCode ?? "KES";

  const unit = await prisma.unit.findFirst({
    where: {
      id: resolvedUnitId,
      deletedAt: null,
      property: {
        orgId: orgId,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      houseNo: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      roomCount: true,
      hasBalcony: true,
      floorArea: true,
      rentAmount: true,
      depositAmount: true,
      serviceCharge: true,
      garbageFee: true,
      securityFee: true,
      electricityBilling: true,
      viewingFeeRequired: true,
      viewingFeeAmount: true,
      status: true,
      vacantSince: true,
      notes: true,
      isPubliclyListed: true,
      publicSlug: true,
      isActive: true,
      sequenceNo: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
          waterRatePerUnit: true,
          waterFixedCharge: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
      sourcePlan: {
        select: {
          id: true,
          unitType: true,
          bedrooms: true,
          bathrooms: true,
          quantity: true,
          defaultRentAmount: true,
          defaultDepositAmount: true,
          houseNoPrefix: true,
          startNumber: true,
          label: true,
          notes: true,
          sortOrder: true,
        },
      },
      leases: {
        where: {
          deletedAt: null,
        },
        orderBy: [
          { startDate: "desc" },
          { createdAt: "desc" },
        ],
        take: 5,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
          deposit: true,
          dueDay: true,
          tenant: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              status: true,
            },
          },
        },
      },
      issues: {
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      },
      waterBills: {
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          period: true,
          total: true,
          dueDate: true,
          status: true,
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      meterReadings: {
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          period: true,
          prevReading: true,
          currentReading: true,
          unitsUsed: true,
          status: true,
          createdAt: true,
        },
      },
      images: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          key: true,
          fileName: true,
        },
      },
      vacancyInquiries: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          message: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          leases: true,
          issues: true,
          waterBills: true,
          meterReadings: true,
          vacancyInquiries: true,
        },
      },
    },
  });

  if (!unit) {
    notFound();
  }

  const canonicalUnitSlug = getUnitSlug({
    id: unit.id,
    houseNo: unit.houseNo,
    buildingName: unit.building?.name,
    propertyName: unit.property.name,
  });

  if (requestedUnitRef !== canonicalUnitSlug) {
    redirect(`/dashboard/org/units/${canonicalUnitSlug}`);
  }

  return { unit, currencyCode };
}

