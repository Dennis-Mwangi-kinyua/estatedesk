import type {
  parseActivityFilter,
  parseStatusFilter,
} from "./helpers";

export const PROPERTY_PAGE_SIZE = 9;
export const UNIT_PAGE_SIZE = 12;

export type UnitsPageView = "properties" | "mixes" | "units";

export type UnitsPageSearchParams = {
  q?: string;
  status?: string;
  activity?: string;
  page?: string;
  property?: string;
  mix?: string;
};

export type UnitsPageProps = {
  searchParams?: Promise<UnitsPageSearchParams>;
};

export type UnitsPropertyRef = {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
};

export type UnitsSelectedMix = {
  key: string;
  label: string;
};

export type PropertyDirectoryItem = {
  property: UnitsPropertyRef;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  mixCount: number;
};

export type UnitMixGroupItem = {
  key: string;
  label: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
};

export type UnitListItem = {
  id: string;
  houseNo: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  rentAmount: unknown;
  status: string;
  isActive: boolean;
  property: UnitsPropertyRef;
  building: {
    id: string;
    name: string;
  } | null;
};

type UnitsPaginationFields = {
  filteredTotal: number;
  filteredOccupied: number;
  filteredVacant: number;
  filteredActive: number;
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
};

type UnitsFilterFields = {
  q: string;
  status: ReturnType<typeof parseStatusFilter>;
  activity: ReturnType<typeof parseActivityFilter>;
  propertyId: string | null;
  mixKey: string | null;
  hasFilters: boolean;
  prevHref: string;
  nextHref: string;
};

type UnitsOrgFields = {
  organizationName: string;
  currencyCode: string;
  totalUnits: number;
  activeUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
};

type UnitsPageBase = UnitsOrgFields & UnitsFilterFields & UnitsPaginationFields;

export type UnitsPageData =
  | (UnitsPageBase & {
      view: "properties";
      propertyDirectory: PropertyDirectoryItem[];
    })
  | (UnitsPageBase & {
      view: "mixes";
      selectedProperty: UnitsPropertyRef;
      unitMixGroups: UnitMixGroupItem[];
    })
  | (UnitsPageBase & {
      view: "units";
      selectedProperty: UnitsPropertyRef;
      selectedMix: UnitsSelectedMix;
      units: UnitListItem[];
    });