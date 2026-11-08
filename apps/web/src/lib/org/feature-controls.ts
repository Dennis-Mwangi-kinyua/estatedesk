export const ORGANIZATION_FEATURE_CONTROLS = [
  { key: "vacantHouses", label: "Vacant houses", description: "Public listings and vacancy inquiries.", defaultEnabled: true },
  { key: "taxes", label: "Tax workspace", description: "Organization tax pages and tools.", defaultEnabled: true },
  { key: "waterBilling", label: "Water billing", description: "Water bills and meter workflows.", defaultEnabled: true },
  { key: "inspections", label: "Inspections", description: "Inspection pages and tools.", defaultEnabled: true },
  { key: "tenantPortal", label: "Tenant portal", description: "Tenant workspace and tenant APIs.", defaultEnabled: true },
] as const;

// Existing integration configuration flags remain supported by the developer matrix.
export const INTEGRATION_FEATURE_KEYS = ["whatsappNotifications", "kraIntegration", "mpesaPayments"] as const;
export const HIDE_PUBLIC_VACANCIES_KEY = "publicVacanciesHidden";
export type OrganizationFeatureKey = typeof ORGANIZATION_FEATURE_CONTROLS[number]["key"] | typeof INTEGRATION_FEATURE_KEYS[number] | typeof HIDE_PUBLIC_VACANCIES_KEY;
export function isOrganizationFeatureKey(value: string): value is OrganizationFeatureKey {
  return value === HIDE_PUBLIC_VACANCIES_KEY || ORGANIZATION_FEATURE_CONTROLS.some(feature => feature.key === value) || (INTEGRATION_FEATURE_KEYS as readonly string[]).includes(value);
}
