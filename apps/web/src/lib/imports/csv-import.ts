import { Prisma, PropertyType, TenantStatus, TenantType, UnitStatus, UnitType } from "@prisma/client";
import { parseCsv, type CsvRow } from "@/lib/csv";
import type { ImportKind } from "@/lib/imports/types";
import { prisma } from "@/lib/prisma";

export type ImportResult = {
  ok: boolean;
  dryRun: boolean;
  kind: ImportKind;
  totalRows: number;
  validRows: number;
  created: number;
  errors: string[];
  preview: string[];
  rowResults: ImportRowResult[];
  rollbackSummary?: string;
};

export type ImportRowResult = {
  line: number;
  label: string;
  status: "valid" | "error";
  errors: string[];
};

const REQUIRED_COLUMNS: Record<ImportKind, string[]> = {
  properties: ["name"],
  units: ["propertyName", "houseNo", "rentAmount"],
  tenants: ["fullName", "phone"],
};

function required(value: CsvRow, key: string) {
  return (value[key] ?? "").trim();
}

function optionalDecimal(value: string) {
  if (!value) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return new Prisma.Decimal(numeric);
}

function optionalInt(value: string) {
  if (!value) return undefined;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) return null;
  return numeric;
}

function enumValue<T extends Record<string, string>>(
  enumObject: T,
  raw: string,
  fallback: T[keyof T],
) {
  if (!raw) return fallback;
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, "_");
  return Object.values(enumObject).includes(normalized)
    ? (normalized as T[keyof T])
    : null;
}

function parseDate(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateRows(kind: ImportKind, rows: CsvRow[]) {
  const errors: string[] = [];
  const preview: string[] = [];
  const rowResults: ImportRowResult[] = [];
  const requiredColumns = REQUIRED_COLUMNS[kind];

  rows.forEach((row, index) => {
    const line = index + 2;
    const rowErrors: string[] = [];
    let label = `Line ${line}`;
    const pushError = (message: string) => {
      errors.push(message);
      rowErrors.push(message);
    };

    for (const column of requiredColumns) {
      if (!required(row, column)) {
        pushError(`Line ${line}: missing ${column}.`);
      }
    }

    if (kind === "properties") {
      if (enumValue(PropertyType, row.type ?? "", PropertyType.RESIDENTIAL) === null) {
        pushError(`Line ${line}: invalid property type.`);
      }
      label = required(row, "name") || `Line ${line}`;
      preview.push(label);
    }

    if (kind === "units") {
      if (enumValue(UnitType, row.type ?? "", UnitType.APARTMENT) === null) {
        pushError(`Line ${line}: invalid unit type.`);
      }
      if (enumValue(UnitStatus, row.status ?? "", UnitStatus.VACANT) === null) {
        pushError(`Line ${line}: invalid unit status.`);
      }
      if (optionalDecimal(row.rentAmount ?? "") === null) {
        pushError(`Line ${line}: rentAmount must be a positive number.`);
      }
      label = `${required(row, "propertyName")} / Unit ${required(row, "houseNo")}`;
      preview.push(label);
    }

    if (kind === "tenants") {
      if (enumValue(TenantStatus, row.status ?? "", TenantStatus.ACTIVE) === null) {
        pushError(`Line ${line}: invalid tenant status.`);
      }
      if (optionalDecimal(row.monthlyRent ?? "") === null) {
        pushError(`Line ${line}: monthlyRent must be a positive number when provided.`);
      }
      if (optionalInt(row.dueDay ?? "") === null) {
        pushError(`Line ${line}: dueDay must be a whole number.`);
      }
      if (parseDate(row.startDate ?? "") === null) {
        pushError(`Line ${line}: startDate must be a valid date.`);
      }
      label = required(row, "fullName") || `Line ${line}`;
      preview.push(label);
    }

    rowResults.push({
      line,
      label,
      status: rowErrors.length > 0 ? "error" : "valid",
      errors: rowErrors,
    });
  });

  return { errors, preview, rowResults };
}

export async function importCsv({
  orgId,
  kind,
  csv,
  dryRun,
}: {
  orgId: string;
  kind: ImportKind;
  csv: string;
  dryRun: boolean;
}): Promise<ImportResult> {
  const rows = parseCsv(csv).slice(0, 500);
  const validation = validateRows(kind, rows);

  if (rows.length === 0) {
    validation.errors.push("No CSV rows found.");
  }

  if (validation.errors.length > 0 || dryRun) {
    return {
      ok: validation.errors.length === 0,
      dryRun,
      kind,
      totalRows: rows.length,
      validRows: rows.length - validation.errors.length,
      created: 0,
      errors: validation.errors,
      preview: validation.preview.slice(0, 10),
      rowResults: validation.rowResults,
      rollbackSummary: validation.errors.length
        ? "No rows were imported because validation failed before commit."
        : "Dry run only. No records were written.",
    };
  }

  let created = 0;

  await prisma.$transaction(async (tx) => {
    if (kind === "properties") {
      for (const row of rows) {
        await tx.property.create({
          data: {
            orgId,
            name: required(row, "name"),
            location: row.location || null,
            address: row.address || null,
            notes: row.notes || null,
            type: enumValue(PropertyType, row.type ?? "", PropertyType.RESIDENTIAL)!,
            waterRatePerUnit: optionalDecimal(row.waterRatePerUnit ?? "") ?? undefined,
            waterFixedCharge: optionalDecimal(row.waterFixedCharge ?? "") ?? undefined,
          },
        });
        created += 1;
      }
    }

    if (kind === "units") {
      for (const row of rows) {
        const property = await tx.property.findFirst({
          where: { orgId, name: required(row, "propertyName"), deletedAt: null },
          select: { id: true },
        });
        if (!property) throw new Error(`Property not found: ${required(row, "propertyName")}`);

        const buildingName = row.buildingName?.trim();
        const building = buildingName
          ? await tx.building.upsert({
              where: { propertyId_name: { propertyId: property.id, name: buildingName } },
              update: { isActive: true, deletedAt: null },
              create: { propertyId: property.id, name: buildingName },
              select: { id: true },
            })
          : null;

        await tx.unit.create({
          data: {
            propertyId: property.id,
            buildingId: building?.id,
            houseNo: required(row, "houseNo"),
            type: enumValue(UnitType, row.type ?? "", UnitType.APARTMENT)!,
            status: enumValue(UnitStatus, row.status ?? "", UnitStatus.VACANT)!,
            bedrooms: optionalInt(row.bedrooms ?? "") ?? undefined,
            bathrooms: optionalInt(row.bathrooms ?? "") ?? undefined,
            roomCount: optionalInt(row.roomCount ?? "") ?? undefined,
            floorArea: row.floorArea ? Number(row.floorArea) : undefined,
            rentAmount: optionalDecimal(row.rentAmount ?? "")!,
            depositAmount: optionalDecimal(row.depositAmount ?? "") ?? undefined,
            notes: row.notes || null,
          },
        });
        created += 1;
      }
    }

    if (kind === "tenants") {
      const { allocateTenantSlug } = await import("@/lib/tenants/slug");
      for (const row of rows) {
        const fullName = required(row, "fullName");
        const tenantSlug = await allocateTenantSlug(tx, orgId, fullName);
        const tenant = await tx.tenant.create({
          data: {
            orgId,
            type: row.companyName ? TenantType.COMPANY : TenantType.INDIVIDUAL,
            fullName,
            slug: tenantSlug,
            companyName: row.companyName || null,
            phone: required(row, "phone"),
            email: row.email || null,
            nationalId: row.nationalId || null,
            kraPin: row.kraPin || null,
            status: enumValue(TenantStatus, row.status ?? "", TenantStatus.ACTIVE)!,
            notes: row.notes || null,
            dataConsent: true,
            consentUpdatedAt: new Date(),
          },
        });

        if (row.unitHouseNo && row.propertyName) {
          const unit = await tx.unit.findFirst({
            where: {
              houseNo: row.unitHouseNo,
              property: { orgId, name: row.propertyName, deletedAt: null },
              deletedAt: null,
            },
            select: { id: true, rentAmount: true, depositAmount: true },
          });

          if (unit) {
            await tx.lease.create({
              data: {
                orgId,
                tenantId: tenant.id,
                unitId: unit.id,
                startDate: parseDate(row.startDate ?? "") ?? new Date(),
                monthlyRent: optionalDecimal(row.monthlyRent ?? "") ?? unit.rentAmount,
                deposit: optionalDecimal(row.deposit ?? "") ?? unit.depositAmount,
                dueDay: optionalInt(row.dueDay ?? "") ?? 5,
                status: "ACTIVE",
                notes: "Created by CSV import.",
              },
            });
            await tx.unit.update({
              where: { id: unit.id },
              data: { status: "OCCUPIED" },
            });
          }
        }

        created += 1;
      }
    }
  });

  return {
    ok: true,
    dryRun,
    kind,
    totalRows: rows.length,
    validRows: rows.length,
    created,
    errors: [],
    preview: validation.preview.slice(0, 10),
    rowResults: validation.rowResults,
    rollbackSummary: `Committed ${created} row${created === 1 ? "" : "s"} in one transaction.`,
  };
}
