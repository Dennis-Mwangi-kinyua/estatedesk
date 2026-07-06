"use server";

export type {
  QuickMeterReadingState,
  SubmitMeterReadingState,
} from "./_lib/types";

export { quickSubmitMeterReading } from "./_lib/quick-submit-meter-reading";
export { submitMeterReading } from "./_lib/submit-meter-reading";