export const APP_PLANS = {
  FREE: {
    name: "Free",
    propertiesLimit: 1,
    unitsLimit: 10,
  },
  STARTER: {
    name: "Starter",
    propertiesLimit: 5,
    unitsLimit: 100,
  },
  GROWTH: {
    name: "Growth",
    propertiesLimit: 20,
    unitsLimit: 500,
  },
  ENTERPRISE: {
    name: "Enterprise",
    propertiesLimit: Number.MAX_SAFE_INTEGER,
    unitsLimit: Number.MAX_SAFE_INTEGER,
  },
} as const;

export type AppPlan = keyof typeof APP_PLANS;