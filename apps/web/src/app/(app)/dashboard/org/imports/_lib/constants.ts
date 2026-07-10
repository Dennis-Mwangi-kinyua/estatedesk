import { Building2, Home, Users, type LucideIcon } from "lucide-react";
import type { ImportKind } from "@/lib/imports/types";

export type ImportKindOption = {
  value: ImportKind;
  label: string;
  description: string;
  requiredColumns: string[];
  optionalColumns: string[];
  icon: LucideIcon;
};

export const IMPORT_KIND_OPTIONS: ImportKindOption[] = [
  {
    value: "properties",
    label: "Properties",
    description: "Create property records with location, billing defaults, and notes.",
    requiredColumns: ["name"],
    optionalColumns: [
      "location",
      "address",
      "type",
      "waterRatePerUnit",
      "waterFixedCharge",
      "notes",
    ],
    icon: Building2,
  },
  {
    value: "units",
    label: "Units",
    description: "Add units to existing properties. Missing buildings are created automatically.",
    requiredColumns: ["propertyName", "houseNo", "rentAmount"],
    optionalColumns: [
      "buildingName",
      "type",
      "status",
      "bedrooms",
      "bathrooms",
      "depositAmount",
      "notes",
    ],
    icon: Home,
  },
  {
    value: "tenants",
    label: "Tenants",
    description: "Onboard tenants and optionally attach an active lease to a unit.",
    requiredColumns: ["fullName", "phone"],
    optionalColumns: [
      "email",
      "nationalId",
      "kraPin",
      "status",
      "unitHouseNo",
      "propertyName",
      "startDate",
      "monthlyRent",
      "deposit",
      "dueDay",
      "notes",
    ],
    icon: Users,
  },
];

export const IMPORT_GUIDANCE = [
  {
    title: "Review properties",
    description:
      "Confirm property names and locations match your CSV before importing units or tenants.",
    href: "/dashboard/org/properties",
    actionLabel: "View properties",
  },
  {
    title: "Check unit inventory",
    description:
      "Validate house numbers, rent defaults, and vacancy before attaching tenant leases.",
    href: "/dashboard/org/units",
    actionLabel: "View units",
  },
  {
    title: "Onboard tenants manually",
    description:
      "Use the tenant form when you need to capture lease terms outside a CSV import.",
    href: "/dashboard/org/tenants/new",
    actionLabel: "Add tenant",
  },
  {
    title: "Organization settings",
    description:
      "Review billing defaults, access control, and workspace preferences after bulk imports.",
    href: "/dashboard/org/settings",
    actionLabel: "Open settings",
  },
] as const;

export const IMPORT_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Choose dataset",
    description: "Select whether you are importing properties, units, or tenants.",
  },
  {
    step: "02",
    title: "Validate CSV",
    description: "Run a dry check to review row-level errors before writing data.",
  },
  {
    step: "03",
    title: "Commit import",
    description: "Import up to 500 rows in one transaction with automatic rollback on failure.",
  },
] as const;