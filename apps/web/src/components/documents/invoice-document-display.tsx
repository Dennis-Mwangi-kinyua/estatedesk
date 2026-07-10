import Link from "next/link";
import { ArrowLeft, Download, Droplets, FileText, Wallet } from "lucide-react";
import type { InvoicePdfData, InvoicePdfLine } from "@/lib/documents/invoice-pdf";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getInvoiceStatusClasses,
} from "@/lib/documents/invoice-format";

type InvoiceDocumentDisplayProps = {
  data: InvoicePdfData;
  verificationQrDataUrl: string;
  downloadHref: string;
  openPdfHref: string;
  backLink?: { href: string; label: string } | null;
  payNowHref?: string | null;
  payWaterHref?: string | null;
  verificationNote?: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-200 py-3 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-start sm:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
        {label}
      </dt>
      <dd className="break-words text-sm font-semibold leading-6 text-slate-950">{value}</dd>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900">
          <span className="h-2.5 w-1 rounded-full bg-emerald-600" aria-hidden />
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-5 text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      <div className="px-4 py-1 sm:px-5">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl>
      {items.map((item) => (
        <DetailRow key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}

function ChargeLineCard({
  line,
  index,
  currencyCode,
}: {
  line: InvoicePdfLine;
  index: number;
  currencyCode: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            Line {index + 1}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">{line.label}</p>
        </div>
        {line.waterReading ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
            <Droplets className="h-3.5 w-3.5" />
            Water
          </span>
        ) : null}
      </div>

      <dl className="mt-3 space-y-2">
        {[
          ["Amount", formatMoney(line.amountDue, currencyCode)],
          ["Paid", formatMoney(line.amountPaid, currencyCode)],
          ["Balance", formatMoney(line.balance, currencyCode)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <dt className="text-xs text-slate-600">{label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function TotalsSummary({ data }: { data: InvoicePdfData }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm text-slate-600">Subtotal</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">
            {formatMoney(data.amountDue, data.currencyCode)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm text-slate-600">Amount paid</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">
            {formatMoney(data.amountPaid, data.currencyCode)}
          </dd>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white px-3 py-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-base font-semibold text-emerald-950">Balance due</dt>
            <dd className="text-lg font-bold tabular-nums text-emerald-700">
              {formatMoney(data.balance, data.currencyCode)}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}

function DesktopChargesTable({ data }: { data: InvoicePdfData }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-emerald-50 text-left text-[11px] uppercase tracking-wide text-emerald-900">
          <tr>
            <th className="px-3 py-2.5 font-medium">#</th>
            <th className="px-3 py-2.5 font-medium">Description</th>
            <th className="px-3 py-2.5 font-medium">Amount</th>
            <th className="px-3 py-2.5 font-medium">Paid</th>
            <th className="px-3 py-2.5 font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line, index) => (
            <tr key={`${line.label}-${index}`} className="border-t border-slate-200">
              <td className="px-3 py-3 text-slate-600">{index + 1}</td>
              <td className="px-3 py-3 font-medium text-slate-900">{line.label}</td>
              <td className="px-3 py-3 tabular-nums text-slate-600">
                {formatMoney(line.amountDue, data.currencyCode)}
              </td>
              <td className="px-3 py-3 tabular-nums text-slate-600">
                {formatMoney(line.amountPaid, data.currencyCode)}
              </td>
              <td className="px-3 py-3 font-semibold tabular-nums text-slate-900">
                {formatMoney(line.balance, data.currencyCode)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200 bg-slate-50">
          <tr>
            <td colSpan={2} className="px-3 py-2 text-slate-600">
              Subtotal
            </td>
            <td className="px-3 py-2 tabular-nums text-slate-900">
              {formatMoney(data.amountDue, data.currencyCode)}
            </td>
            <td className="px-3 py-2" />
            <td className="px-3 py-2" />
          </tr>
          <tr>
            <td colSpan={2} className="px-3 py-2 text-slate-600">
              Amount paid
            </td>
            <td className="px-3 py-2 tabular-nums text-slate-900">
              {formatMoney(data.amountPaid, data.currencyCode)}
            </td>
            <td className="px-3 py-2" />
            <td className="px-3 py-2" />
          </tr>
          <tr>
            <td colSpan={4} className="px-3 py-3 font-semibold text-slate-900">
              Balance due
            </td>
            <td className="px-3 py-3 text-base font-bold tabular-nums text-emerald-700">
              {formatMoney(data.balance, data.currencyCode)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function InvoiceDocumentDisplay({
  data,
  verificationQrDataUrl,
  downloadHref,
  openPdfHref,
  backLink = null,
  payNowHref = null,
  payWaterHref = null,
  verificationNote = "Scan the QR code or verify using the serial number / code on EstateDesk.",
}: InvoiceDocumentDisplayProps) {
  const propertyUnit = [data.propertyName, data.unitName, data.buildingName]
    .filter(Boolean)
    .join(" · ");
  const orgContact =
    [data.organizationPhone, data.organizationEmail].filter(Boolean).join(" · ") ||
    "Not supplied";
  const waterLine = data.lines.find((line) => line.waterReading);

  const invoiceDetails = [
    { label: "Organisation", value: data.organizationName },
    { label: "Tenant", value: data.tenantName },
    { label: "Tenant reference", value: data.tenantIdentifier ?? "—" },
    { label: "Property / unit", value: propertyUnit },
    { label: "Billing period", value: data.period },
    { label: "Due date", value: formatDate(data.dueDate) },
    { label: "Issued at", value: formatDateTime(data.issuedAt) },
    { label: "Organisation contact", value: orgContact },
    { label: "Reading submitted by", value: data.submittedByName ?? "Not recorded" },
    {
      label: "Bill confirmed by",
      value: data.confirmedByName ?? "Awaiting confirmation",
    },
    {
      label: "Confirmed at",
      value: data.confirmedAt ? formatDateTime(data.confirmedAt) : "Pending",
    },
  ];

  return (
    <div className="ed-mobile-surface mx-auto w-full min-w-0 max-w-5xl">
      <div className="ed-invoice-toolbar mb-5 space-y-3">
        {backLink ? (
          <Link
            href={backLink.href}
            className="ed-invoice-action--link inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {backLink.label}
          </Link>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <a
            href={openPdfHref}
            target="_blank"
            rel="noreferrer"
            className="ed-invoice-action--ghost inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 shrink-0" />
            Open PDF
          </a>
          <a
            href={downloadHref}
            className="ed-invoice-action--ghost inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4 shrink-0" />
            Download PDF
          </a>
          {payNowHref ? (
            <Link
              href={payNowHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 sm:col-span-2 lg:col-span-1"
            >
              <Wallet className="h-4 w-4 shrink-0" />
              Pay balance
            </Link>
          ) : null}
          {payWaterHref ? (
            <Link
              href={payWaterHref}
              className="ed-invoice-action--water inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 transition hover:bg-sky-100 sm:col-span-2 lg:col-span-1"
            >
              <Droplets className="h-4 w-4 shrink-0" />
              Pay water only
            </Link>
          ) : null}
        </div>
      </div>

      <article className="ed-invoice-paper overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
        <header className="ed-invoice-paper-header border-b-4 border-emerald-600 bg-[#0f172a] px-4 py-5 text-white sm:px-6 sm:py-7">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight text-emerald-100 sm:text-2xl">
                  EstateDesk Invoice
                </h1>
                <p className="mt-2 break-words text-base font-semibold text-slate-100 sm:text-lg">
                  {data.organizationName}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  System-generated tenant invoice
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${getInvoiceStatusClasses(
                  data.status,
                )}`}
              >
                {data.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Period</p>
                <p className="mt-1 text-sm font-semibold">{data.period}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Due</p>
                <p className="mt-1 text-sm font-semibold">{formatDate(data.dueDate)}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-200">
                  Balance due
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-emerald-100">
                  {formatMoney(data.balance, data.currencyCode)}
                </p>
              </div>
            </div>

            <div className="space-y-1 border-t border-white/10 pt-3">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">INVOICE</p>
              <p className="break-all text-xs font-semibold text-slate-300">{data.serialNumber}</p>
            </div>
          </div>
        </header>

        <div className="ed-invoice-paper-body space-y-4 p-3 sm:space-y-5 sm:p-6">
          <SectionCard title="Invoice details">
            <DetailList items={invoiceDetails} />
          </SectionCard>

          {data.previousBill ? (
            <SectionCard
              title="Previous billing period"
              subtitle={data.previousBill.period}
            >
              <DetailList
                items={[
                  {
                    label: "Total billed",
                    value: formatMoney(data.previousBill.amountDue, data.currencyCode),
                  },
                  {
                    label: "Paid",
                    value: formatMoney(data.previousBill.amountPaid, data.currencyCode),
                  },
                  {
                    label: "Balance",
                    value: formatMoney(data.previousBill.balance, data.currencyCode),
                  },
                  { label: "Status", value: data.previousBill.status },
                  {
                    label: "Rent",
                    value:
                      data.previousBill.rentTotal != null
                        ? formatMoney(data.previousBill.rentTotal, data.currencyCode)
                        : "—",
                  },
                  {
                    label: "Water",
                    value:
                      data.previousBill.waterTotal != null
                        ? formatMoney(data.previousBill.waterTotal, data.currencyCode)
                        : "—",
                  },
                ]}
              />
            </SectionCard>
          ) : null}

          <SectionCard title="Charges" subtitle="All billed line items for this period">
            <div className="space-y-3 py-3 lg:hidden">
              {data.lines.map((line, index) => (
                <ChargeLineCard
                  key={`${line.label}-${index}`}
                  line={line}
                  index={index}
                  currencyCode={data.currencyCode}
                />
              ))}
              <TotalsSummary data={data} />
            </div>
            <div className="hidden py-3 lg:block">
              <DesktopChargesTable data={data} />
            </div>
          </SectionCard>

          {waterLine?.waterReading ? (
            <SectionCard title="Water meter reading">
              <DetailList
                items={[
                  {
                    label: "Previous reading",
                    value: String(waterLine.waterReading.prevReading),
                  },
                  {
                    label: "Current reading",
                    value: String(waterLine.waterReading.currentReading),
                  },
                  {
                    label: "Units consumed",
                    value: String(waterLine.waterReading.unitsUsed),
                  },
                  {
                    label: "Rate per unit",
                    value: formatMoney(
                      waterLine.waterReading.ratePerUnit,
                      data.currencyCode,
                    ),
                  },
                  {
                    label: "Fixed charge",
                    value: formatMoney(
                      waterLine.waterReading.fixedCharge,
                      data.currencyCode,
                    ),
                  },
                  {
                    label: "Reading status",
                    value: waterLine.waterReading.readingStatus,
                  },
                  {
                    label: "Bill status",
                    value: waterLine.waterReading.billStatus,
                  },
                  {
                    label: "Submitted by",
                    value: waterLine.waterReading.submittedByName ?? "Not recorded",
                  },
                  {
                    label: "Confirmed by",
                    value: waterLine.waterReading.confirmedByName ?? "Awaiting confirmation",
                  },
                ]}
              />
            </SectionCard>
          ) : null}

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900">
              <span className="h-2.5 w-1 rounded-full bg-emerald-600" aria-hidden />
              Document verification
            </p>

            <div className="mt-4 space-y-4">
              <div className="ed-invoice-qr mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verificationQrDataUrl}
                  alt={`QR code to verify invoice ${data.serialNumber}`}
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-xl"
                />
              </div>

              <p className="text-sm leading-6 text-slate-600">{verificationNote}</p>

              <dl className="space-y-3">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                    Serial number
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                    {data.serialNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                    Verification code
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                    {data.verificationCode}
                  </dd>
                </div>
              </dl>

              <p className="text-xs leading-5 text-slate-600">
                This is a system-generated invoice issued by EstateDesk on behalf of the
                organisation named above. It is not handwritten and does not require a physical
                signature. Verify authenticity before making payment.
              </p>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
