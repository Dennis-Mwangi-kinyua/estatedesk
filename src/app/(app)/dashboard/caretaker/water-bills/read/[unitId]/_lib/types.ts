export type SubmitMeterReadingState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    prevReading?: string;
    currentReading?: string;
    photo?: string;
    notes?: string;
  };
};

export type QuickMeterReadingState = {
  error?: string;
  success?: string;
  submittedUnitIds?: string[];
  submittedUnitId?: string;
  submittedHouseNo?: string;
  previousReading?: number;
  unitsUsed?: number;
  fieldErrors?: {
    unitId?: string;
    currentReading?: string;
    photo?: string;
    notes?: string;
  };
};