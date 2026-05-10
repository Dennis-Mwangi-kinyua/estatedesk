export const APP_PLANS = {
  FREE: {
    name: "Free",
    monthlyAmount: 0,
    propertiesLimit: 1,
    unitsLimit: 10,
  },
  PRO: {
    name: "Pro",
    monthlyAmount: 3500,
    propertiesLimit: 5,
    unitsLimit: 100,
  },
  PLUS: {
    name: "Plus",
    monthlyAmount: 7500,
    propertiesLimit: 20,
    unitsLimit: 500,
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyAmount: 0,
    propertiesLimit: Number.MAX_SAFE_INTEGER,
    unitsLimit: Number.MAX_SAFE_INTEGER,
  },
} as const;

export type AppPlan = keyof typeof APP_PLANS;
