export const PROPERTY_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MIXED_USE", label: "Mixed use" },
  { value: "GODOWN", label: "Godown" },
] as const;

export const STEPS = [
  {
    id: 1,
    title: "Property profile",
    description: "Basic identity, classification, and taxpayer linkage.",
  },
  {
    id: 2,
    title: "Landlord",
    description: "Link ownership and login access.",
  },
  {
    id: 3,
    title: "Billing & status",
    description: "Water billing defaults and availability settings.",
  },
  {
    id: 4,
    title: "Unit mix",
    description: "Define the units that should be created automatically.",
  },
  {
    id: 5,
    title: "Review",
    description: "Confirm every detail before property creation.",
  },
] as const;