-- New cash and deposit-offset payments start without allocations.
ALTER TABLE "Payment" ALTER COLUMN "coveredPeriods" SET DEFAULT ARRAY[]::TEXT[];
