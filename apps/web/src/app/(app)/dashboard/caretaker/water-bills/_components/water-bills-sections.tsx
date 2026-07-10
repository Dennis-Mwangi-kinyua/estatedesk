import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/issues/_components/issues-ui";
import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatCurrency } from "../_lib/helpers";
import { CURRENT_PERIOD, type CaretakerWaterBillsData } from "../_lib/types";
import {
  getBillHref,
  getPendingUnitHref,
  getReadingHref,
  IssuedBillCard,
  MeterReadingCard,
  StatusBadge,
} from "./water-bills-ui";

export function WaterBillsPendingSection({
  data,
}: {
  data: CaretakerWaterBillsData;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Needs submission"
        title="Apartments pending readings"
        action={
          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
            {data.pendingUnits.length} pending
          </span>
        }
      />

      <div className="p-4 sm:p-5">
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : data.pendingUnits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
            All occupied apartments have readings submitted for {CURRENT_PERIOD}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.pendingUnits.map((unit) => (
              <MeterReadingCard
                key={unit.id}
                href={getPendingUnitHref(unit.id)}
                property={unit.property}
                building={unit.building}
                houseNo={unit.houseNo}
                tenant={unit.tenant}
                previousReading={unit.previousReading}
                currentReading={unit.currentReading}
                unitsUsed={unit.unitsUsed}
                status="NOT_SUBMITTED"
                period={unit.period}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function WaterBillsApprovalSection({
  data,
}: {
  data: CaretakerWaterBillsData;
}) {
  if (!data.ok) {
    return null;
  }

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className={panelShellClassName}>
        <SectionIntro
          eyebrow="Awaiting office approval"
          title="Submitted readings"
          action={<StatusBadge label="Submitted" tone="blue" />}
        />

        <div className="space-y-3 p-4 sm:p-5">
          {data.submittedReadings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
              No submitted readings are waiting for approval.
            </div>
          ) : (
            data.submittedReadings.map((reading) => (
              <MeterReadingCard
                key={reading.id}
                href={getReadingHref(reading.id)}
                property={reading.property}
                building={reading.building}
                houseNo={reading.houseNo}
                tenant={reading.tenant}
                previousReading={reading.previousReading}
                currentReading={reading.currentReading}
                unitsUsed={reading.unitsUsed}
                status="SUBMITTED"
                period={reading.period}
                submittedAt={reading.submittedAt}
              />
            ))
          )}
        </div>
      </div>

      <div className={panelShellClassName}>
        <SectionIntro
          eyebrow="Approved readings"
          title="Ready for tenant billing"
          action={<StatusBadge label="Approved" tone="green" />}
        />

        <div className="space-y-3 p-4 sm:p-5">
          {data.approvedReadings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
              No approved readings are waiting for billing.
            </div>
          ) : (
            data.approvedReadings.map((reading) => (
              <MeterReadingCard
                key={reading.id}
                href={getReadingHref(reading.id)}
                property={reading.property}
                building={reading.building}
                houseNo={reading.houseNo}
                tenant={reading.tenant}
                previousReading={reading.previousReading}
                currentReading={reading.currentReading}
                unitsUsed={reading.unitsUsed}
                status="APPROVED"
                period={reading.period}
                submittedAt={reading.submittedAt}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function WaterBillsIssuedSection({
  data,
}: {
  data: CaretakerWaterBillsData;
}) {
  if (!data.ok) {
    return null;
  }

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Tenant billing"
        title="Bills already sent to tenants"
        action={<StatusBadge label="Issued bills" tone="violet" />}
      />

      {data.issuedBills.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          <p>No tenant water bills have been issued for {CURRENT_PERIOD}.</p>
          <div className="mt-4">
            <InAppGuideLink topic="water" workspace="caretaker" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-2">
          {data.issuedBills.map((bill) => (
            <IssuedBillCard
              key={bill.id}
              id={bill.id}
              property={bill.property}
              building={bill.building}
              houseNo={bill.houseNo}
              tenant={bill.tenant}
              unitsUsed={bill.unitsUsed}
              total={formatCurrency(bill.total)}
              dueDate={bill.dueDate}
              period={bill.period}
            />
          ))}
        </div>
      )}
    </section>
  );
}