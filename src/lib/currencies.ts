export const SUPPORTED_CURRENCIES = [
  { code: "KES", name: "Kenyan Shilling", region: "East Africa" },
  { code: "UGX", name: "Ugandan Shilling", region: "East Africa" },
  { code: "TZS", name: "Tanzanian Shilling", region: "East Africa" },
  { code: "RWF", name: "Rwandan Franc", region: "East Africa" },
  { code: "BIF", name: "Burundian Franc", region: "East Africa" },
  { code: "SSP", name: "South Sudanese Pound", region: "East Africa" },
  { code: "CDF", name: "Congolese Franc", region: "East Africa" },
  { code: "ETB", name: "Ethiopian Birr", region: "East Africa" },
  { code: "SOS", name: "Somali Shilling", region: "East Africa" },
  { code: "DJF", name: "Djiboutian Franc", region: "East Africa" },
  { code: "ERN", name: "Eritrean Nakfa", region: "East Africa" },
  { code: "SDG", name: "Sudanese Pound", region: "East Africa" },
  { code: "AED", name: "UAE Dirham", region: "United Arab Emirates" },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

const currencyCodes = new Set<string>(SUPPORTED_CURRENCIES.map((currency) => currency.code));

export function isSupportedCurrency(value: string): value is SupportedCurrencyCode {
  return currencyCodes.has(value.toUpperCase());
}
