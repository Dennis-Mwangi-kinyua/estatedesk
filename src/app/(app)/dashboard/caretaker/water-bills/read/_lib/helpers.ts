export const METER_READ_LOAD_ERROR_MESSAGE =
  "We couldn't load meter reading units right now. Please refresh the page or try again in a few minutes.";

export function buildReadPageHref(period: string) {
  return `/dashboard/caretaker/water-bills/read?period=${period}`;
}

export function buildUnitReadHref(unitPublicId: string, period: string) {
  return `/dashboard/caretaker/water-bills/read/${unitPublicId}?period=${period}`;
}