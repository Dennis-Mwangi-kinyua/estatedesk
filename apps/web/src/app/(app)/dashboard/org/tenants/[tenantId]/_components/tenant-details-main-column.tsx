import Image from "next/image";
import type { TenantDetailsData } from "../_lib/types";
import {
  DetailItem,
  SectionHeader,
  formatBoolean,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  getLeaseUnitLabel,
  getStatusClasses,
  imageUrl,
} from "./tenant-details-ui";

export function TenantDetailsMainColumn({ data }: { data: TenantDetailsData }) {
  const { tenant, tenantHistory } = data;
  return (
      <div className="space-y-5">
        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Tenant information"
            description="Core tenant identity, contact details, and compliance fields."
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Full name" value={tenant.fullName} />
            <DetailItem label="Tenant type" value={formatStatus(tenant.type)} />
            <DetailItem label="Phone number" value={tenant.phone || "—"} />
            <DetailItem label="Email address" value={tenant.email || "—"} />
            <DetailItem label="National ID" value={tenant.nationalId || "—"} mono />
            <DetailItem label="KRA PIN" value={tenant.kraPin || "—"} mono />
            <DetailItem label="Company" value={tenant.companyName || "—"} />
            <DetailItem label="Data consent" value={formatBoolean(tenant.dataConsent)} />
            <DetailItem label="Marketing consent" value={formatBoolean(tenant.marketingConsent)} />
            <DetailItem label="Consent updated" value={formatDateTime(tenant.consentUpdatedAt)} />
            <DetailItem label="Profile image" value={tenant.profileImage?.fileName || "No file linked"} />
          </div>
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Lease portfolio"
            description="Current occupancy, rent terms, and complete lease history for this tenant."
          />

          <div className="mt-4 space-y-3">
            {tenant.leases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                No lease records found for this tenant.
              </div>
            ) : (
              tenant.leases.map((lease) => {
                const leaseActive = String(lease.status).toUpperCase() === "ACTIVE";

                return (
                  <div
                    key={lease.id}
                    className="rounded-3xl ed-theme-card border border-border bg-muted/35 p-4 transition hover:border-black/10"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {getLeaseUnitLabel(lease)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
                          lease.status,
                        )}`}
                      >
                        {formatStatus(lease.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <DetailItem label="Rent" value={formatCurrency(lease.monthlyRent)} />
                      <DetailItem label="Deposit" value={formatCurrency(lease.deposit)} />
                      <DetailItem label="Due day" value={lease.dueDay ? `${lease.dueDay}th day` : "—"} />
                      <DetailItem label="Lease start" value={formatDate(lease.startDate)} />
                      <DetailItem label="Lease end" value={formatDate(lease.endDate)} />
                    </div>

                    {lease.unit.images.length > 0 ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {lease.unit.images.map((asset) => (
                          <div
                            key={asset.id}
                            className="relative aspect-[4/3] overflow-hidden rounded-2xl ed-theme-card border border-border bg-card"
                          >
                            <Image
                              src={imageUrl(asset.key)}
                              alt={asset.fileName}
                              fill
                              sizes="(min-width: 1024px) 18vw, 50vw"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <DetailItem label="Caretaker" value={lease.caretaker?.fullName || "Not assigned"} />
                      <DetailItem label="Caretaker email" value={lease.caretaker?.email || "—"} />
                    </div>

                    {lease.notes ? (
                      <div className="mt-4 rounded-2xl ed-theme-card border border-border bg-card p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                          Lease notes
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                          {lease.notes}
                        </p>
                      </div>
                    ) : null}

                    {leaseActive ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        This is the tenant’s current active lease record.
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <SectionHeader
            title="Tenant history"
            description="Chronological history built from onboarding, leases, payments, notices, and tenant action logs."
          />

          <div className="mt-5 space-y-4">
            {tenantHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                No tenant history is available yet.
              </div>
            ) : (
              tenantHistory.map((item) => {
                const toneClasses =
                  item.tone === "success"
                    ? "border-emerald-200 bg-emerald-50"
                    : item.tone === "danger"
                      ? "border-red-200 bg-red-50"
                      : "border-border bg-muted/35";

                return (
                  <div key={item.id} className={`rounded-3xl border p-4 ${toneClasses}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground/80">
                            {item.kind}
                          </span>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-foreground/80">{item.description}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground/80">
                          {item.tag}
                        </span>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
  );
}
