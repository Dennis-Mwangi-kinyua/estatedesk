import Link from "next/link";
import { encodePublicId } from "@/lib/public-id";
import { computeRentRewards } from "@/lib/rewards/rent-rewards";
import type { TenantDetailsData } from "../_lib/types";
import {
  DetailItem,
  SectionHeader,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  getLeaseUnitLabel,
  getStatusClasses,
  getUnitLabel,
} from "./tenant-details-ui";

export function TenantDetailsSidebarColumn({ data }: { data: TenantDetailsData }) {
  const {
    tenant,
    currentUnit,
    currentRent,
    currentDeposit,
    totalPayments,
  } = data;

  const rewards = computeRentRewards(
    (tenant.payments ?? []).map((payment) => ({
      paidAt: payment.paidAt ?? payment.createdAt,
      amount: Number(payment.amount),
      verificationStatus: payment.verificationStatus,
      gatewayStatus: payment.gatewayStatus,
    })),
  );
  return (
      <div className="space-y-5">
        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Account summary"
            description="Lifecycle, status, and high-level account overview."
          />

          <div className="mt-4 grid gap-3">
            <DetailItem label="Tenant since" value={formatDate(tenant.createdAt)} />
            <DetailItem label="Current unit" value={currentUnit} />
            <DetailItem label="Monthly rent" value={currentRent} />
            <DetailItem label="Deposit held" value={currentDeposit} />
            <DetailItem label="Archived at" value={formatDate(tenant.archivedAt)} />
            <DetailItem label="Blacklisted at" value={formatDate(tenant.blacklistedAt)} />
            <DetailItem label="Blacklist reason" value={tenant.blacklistReason || "—"} />
            <DetailItem label="Deleted at" value={formatDate(tenant.deletedAt)} />
            <DetailItem label="Payments logged" value={formatCurrency(totalPayments)} />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <a
              href={`/dashboard/org/tenants/${tenant.id}/tribunal-pack`}
              className="inline-flex items-center justify-center rounded-full border border-teal-700/20 bg-teal-700 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-teal-800"
            >
              Download tribunal pack (PDF)
            </a>
            <p className="text-[11px] text-muted-foreground">
              One-click Rent Restriction Tribunal export: payments, charges, and communication logs.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="RentRewards"
            description="Loyalty points for early and on-time rent payments."
          />
          <div className="mt-4 grid gap-3">
            <DetailItem label="Points" value={String(rewards.points)} />
            <DetailItem label="Tier" value={rewards.tier} />
            <DetailItem label="Early payments" value={String(rewards.earlyPayments)} />
            <DetailItem label="On-time payments" value={String(rewards.onTimePayments)} />
            <DetailItem label="Streak (months)" value={String(rewards.streakMonths)} />
            {rewards.nextTier ? (
              <DetailItem
                label="Next tier"
                value={`${rewards.nextTier} · ${rewards.pointsToNextTier} pts to go`}
              />
            ) : null}
          </div>
          {rewards.suggestedRewards.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {rewards.suggestedRewards.slice(0, 3).map((item) => (
                <li key={item.id}>
                  {item.label} · {item.pointsCost} pts
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Keep paying on time to unlock data bundles and shopping tokens.
            </p>
          )}
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Next of kin"
            description="Emergency and contact fallback details linked to this tenant."
          />

          {tenant.nextOfKin ? (
            <div className="mt-4 grid gap-3">
              <DetailItem label="Name" value={tenant.nextOfKin.name} />
              <DetailItem label="Relationship" value={tenant.nextOfKin.relationship} />
              <DetailItem label="Phone" value={tenant.nextOfKin.phone} />
              <DetailItem label="Email" value={tenant.nextOfKin.email || "—"} />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
              No next of kin has been linked to this tenant.
            </div>
          )}
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Recent payments"
            description="Latest payment records linked to the tenant account."
          />

          <div className="mt-4 space-y-3">
            {tenant.payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                No payment records found.
              </div>
            ) : (
              tenant.payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl ed-theme-card border border-border bg-muted/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(payment.amount)} • {formatStatus(payment.targetType)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(payment.paidAt ?? payment.createdAt)} • {formatStatus(payment.method)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          payment.gatewayStatus,
                        )}`}
                      >
                        {formatStatus(payment.gatewayStatus)}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          payment.verificationStatus,
                        )}`}
                      >
                        {formatStatus(payment.verificationStatus)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-foreground/80">
                    <span className="font-semibold text-foreground">Reference:</span> {payment.reference || "—"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Water bills"
            description="Recent utility billing history for units occupied by this tenant."
          />

          <div className="mt-4 space-y-3">
            {tenant.waterBills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                No water bills found.
              </div>
            ) : (
              tenant.waterBills.map((bill) => (
                <div key={bill.id} className="rounded-2xl ed-theme-card border border-border bg-muted/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {bill.period} • {formatCurrency(bill.total)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getUnitLabel(bill.unit)} • Due {formatDate(bill.dueDate)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                        bill.status,
                      )}`}
                    >
                      {formatStatus(bill.status)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-foreground/80">
                    <span className="font-semibold text-foreground">Units used:</span> {bill.unitsUsed}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Move-out notices"
            description="Notice and inspection records associated with the tenant."
          />

          <div className="mt-4 space-y-3">
            {tenant.moveOutNotices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                No move-out notices recorded.
              </div>
            ) : (
              tenant.moveOutNotices.map((notice) => (
                <div key={notice.id} className="rounded-2xl ed-theme-card border border-border bg-muted/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {getLeaseUnitLabel(notice.lease)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Notice {formatDate(notice.noticeDate)} • Move-out {formatDate(notice.moveOutDate)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                        notice.status,
                      )}`}
                    >
                      {formatStatus(notice.status)}
                    </span>
                  </div>

                  {notice.inspection ? (
                    <div className="mt-3 rounded-2xl ed-theme-card border border-border bg-card p-3 text-sm text-foreground/80">
                      <p>
                        <span className="font-semibold text-foreground">Inspection:</span>{" "}
                        {formatStatus(notice.inspection.status)}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-foreground">Inspector:</span>{" "}
                        {notice.inspection.inspector.fullName}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-foreground">Scheduled:</span>{" "}
                        {formatDateTime(notice.inspection.scheduledAt)}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-foreground">Completed:</span>{" "}
                        {formatDateTime(notice.inspection.completedAt)}
                      </p>

                      {String(notice.inspection.status).toUpperCase() === "COMPLETED" ? (
                        <div className="mt-3">
                          <Link
                            href={`/dashboard/org/inspections/${encodePublicId(
                              notice.inspection.id,
                              "inspection",
                            )}`}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-card px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                          >
                            View inspection report
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {notice.notes ? (
                    <p className="mt-3 text-sm text-foreground/80">
                      <span className="font-semibold text-foreground">Notes:</span> {notice.notes}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Internal notes"
            description="Private notes visible to authorised staff only."
          />

          <div className="mt-4 rounded-3xl ed-theme-card border border-border bg-muted/35 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">
              {tenant.notes || "No notes available for this tenant."}
            </p>
          </div>
        </section>
      </div>
  );
}
