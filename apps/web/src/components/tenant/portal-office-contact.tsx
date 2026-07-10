"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CreditCard, Phone, UserRound } from "lucide-react";
import { WorkspaceDetailPanel } from "@/components/help/workspace-detail-panel";
import {
  getBankAccountForMethod,
  hasAnyPaymentInstructions,
  listAvailablePaymentMethods,
  type PaymentInstructions,
} from "@/lib/payments/instructions";
import { getPaymentMethodDefinition } from "@/lib/payments/methods-catalog";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

type PortalOfficeContactProps = {
  org: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  paymentInstructions: PaymentInstructions;
  caretakerContact?: {
    fullName: string;
    phone: string | null;
    email: string | null;
  } | null;
  layout?: "compact" | "strip";
};

function ContactField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function OfficeFields({
  org,
  caretakerContact,
  includeCaretaker = true,
}: Pick<PortalOfficeContactProps, "org" | "caretakerContact"> & {
  includeCaretaker?: boolean;
}) {
  const hasCaretaker = Boolean(
    caretakerContact?.fullName ||
      caretakerContact?.phone ||
      caretakerContact?.email,
  );

  return (
    <>
      <ContactField label="Organisation" value={org.name} />
      <ContactField label="Phone" value={org.phone} />
      <ContactField label="Email" value={org.email} />
      <ContactField label="Address" value={org.address} />
      {includeCaretaker && hasCaretaker && caretakerContact ? (
        <>
          <ContactField label="Caretaker" value={caretakerContact.fullName} />
          <ContactField label="Caretaker phone" value={caretakerContact.phone} />
          <ContactField label="Caretaker email" value={caretakerContact.email} />
        </>
      ) : null}
    </>
  );
}

function PaymentFields({ instructions }: { instructions: PaymentInstructions }) {
  if (!hasAnyPaymentInstructions(instructions)) {
    return (
      <p className="text-sm text-muted-foreground">
        Payment instructions have not been published yet.
      </p>
    );
  }

  const available = listAvailablePaymentMethods(instructions);

  return (
    <>
      {available.map((method) => {
        if (method.id === "mpesa") {
          return (
            <div key={method.id} className="contents">
              <ContactField label="M-Pesa name" value={instructions.mpesaBusinessName} />
              <ContactField label="Paybill" value={instructions.mpesaPaybill} />
              <ContactField label="Till" value={instructions.mpesaTillNumber} />
              <ContactField
                label="M-Pesa account"
                value={instructions.mpesaAccountNumber}
              />
            </div>
          );
        }

        if (method.id === "kcb") {
          return (
            <div key={method.id} className="contents">
              <ContactField
                label="KCB paybill name"
                value={instructions.kcbBusinessName || instructions.kcbAccountName}
              />
              <ContactField label="KCB paybill" value={instructions.kcbPaybill} />
              <ContactField
                label="KCB account"
                value={instructions.kcbAccountNumber}
              />
            </div>
          );
        }

        if (method.id === "airtel-money") {
          return (
            <div key={method.id} className="contents">
              <ContactField
                label="Airtel name"
                value={instructions.airtelBusinessName}
              />
              <ContactField label="Airtel number" value={instructions.airtelNumber} />
            </div>
          );
        }

        const account = getBankAccountForMethod(instructions, method.id);
        if (!account) return null;
        const label =
          account.businessName ||
          getPaymentMethodDefinition(method.id)?.name ||
          method.name;

        return (
          <div key={method.id} className="contents">
            <ContactField label="Bank" value={label} />
            <ContactField label="Account name" value={account.accountName} />
            <ContactField label="Account number" value={account.accountNumber} />
          </div>
        );
      })}
    </>
  );
}

function buildSummary({
  org,
  hasPaymentInstructions,
  hasCaretaker,
}: {
  org: PortalOfficeContactProps["org"];
  hasPaymentInstructions: boolean;
  hasCaretaker: boolean;
}) {
  const parts = [org.name];

  if (org.phone) parts.push("phone");
  if (hasPaymentInstructions) parts.push("payment methods");
  if (hasCaretaker) parts.push("caretaker");

  if (parts.length === 1) {
    return "Office contact details for your property team.";
  }

  return `${parts.slice(1).join(", ")} for ${org.name}.`;
}

function OfficeContactDetails({
  org,
  paymentInstructions,
  caretakerContact,
  showPaymentsLink = true,
  separateCaretakerSection = false,
}: {
  org: PortalOfficeContactProps["org"];
  paymentInstructions: PaymentInstructions;
  caretakerContact: PortalOfficeContactProps["caretakerContact"];
  showPaymentsLink?: boolean;
  separateCaretakerSection?: boolean;
}) {
  const hasOrgContact = Boolean(org.phone || org.email || org.address);
  const hasPaymentInstructions = hasAnyPaymentInstructions(paymentInstructions);
  const hasCaretaker = Boolean(
    caretakerContact?.fullName ||
      caretakerContact?.phone ||
      caretakerContact?.email,
  );

  return (
    <>
      {hasOrgContact || hasCaretaker ? (
        <section className={`${panelShellClassName} p-4 sm:p-5`}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Office
          </div>
          <div className="mt-3 space-y-2.5">
            <OfficeFields
              org={org}
              caretakerContact={caretakerContact}
              includeCaretaker={!separateCaretakerSection}
            />
          </div>
        </section>
      ) : null}

      {separateCaretakerSection && hasCaretaker && caretakerContact ? (
        <section className={`${panelShellClassName} p-4 sm:p-5`}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" />
            On-site caretaker
          </div>
          <div className="mt-3 grid gap-3">
            <ContactField label="Name" value={caretakerContact.fullName} />
            <ContactField label="Phone" value={caretakerContact.phone} />
            <ContactField label="Email" value={caretakerContact.email} />
          </div>
        </section>
      ) : null}

      {hasPaymentInstructions ? (
        <section className={`${panelShellClassName} p-4 sm:p-5`}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            Payment instructions
          </div>
          <div className="mt-3 space-y-2.5">
            <PaymentFields instructions={paymentInstructions} />
          </div>
          {showPaymentsLink ? (
            <Link
              href="/dashboard/tenant/payments"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary/80"
            >
              Open payments
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

export function PortalOfficeContact({
  org,
  paymentInstructions,
  caretakerContact,
  layout = "strip",
}: PortalOfficeContactProps) {
  const instructions = paymentInstructions;
  const hasOrgContact = Boolean(org.phone || org.email || org.address);
  const hasPaymentInstructions = hasAnyPaymentInstructions(instructions);
  const hasCaretaker = Boolean(
    caretakerContact?.fullName ||
      caretakerContact?.phone ||
      caretakerContact?.email,
  );

  if (!hasOrgContact && !hasPaymentInstructions && !hasCaretaker) {
    return null;
  }

  const title =
    layout === "compact" ? "Contact & payments" : "Contact & payment details";
  const description = buildSummary({
    org,
    hasPaymentInstructions,
    hasCaretaker,
  });

  return (
    <WorkspaceDetailPanel
      eyebrow="Property office"
      title={title}
      description={description}
      actionLabel="View details"
      icon={Building2}
      triggerClassName={panelShellClassName}
    >
      {layout === "strip" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Reach your property office for tenancy and billing support.
            </div>
            <Link
              href="/dashboard/tenant/payments"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted/30"
            >
              View payments
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <OfficeContactDetails
            org={org}
            paymentInstructions={instructions}
            caretakerContact={caretakerContact}
            showPaymentsLink={false}
            separateCaretakerSection
          />
        </div>
      ) : (
        <OfficeContactDetails
          org={org}
          paymentInstructions={instructions}
          caretakerContact={caretakerContact}
        />
      )}
    </WorkspaceDetailPanel>
  );
}