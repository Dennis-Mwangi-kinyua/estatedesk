export const ONBOARDING_REQUEST_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "DISQUALIFIED",
  "CLOSED",
  "REJECTED",
] as const;

export type OnboardingRequestStatus = (typeof ONBOARDING_REQUEST_STATUSES)[number];
export const ONBOARDING_ALERT_STATUS = "NEW" as const;

export function isOnboardingAlertPending(status: string) {
  return status === ONBOARDING_ALERT_STATUS;
}

export function isClosedOnboardingStatus(status: string) {
  return ["WON", "DISQUALIFIED", "CLOSED", "REJECTED"].includes(status);
}
