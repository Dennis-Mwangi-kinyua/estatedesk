import Link from "next/link";
import { ArrowUpRight, Building2, CreditCard, Phone, UserRound } from "lucide-react";
import type { PaymentInstructions } from "@/lib/payments/instructions";

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
}: Pick<PortalOfficeContactProps, "org" | "caretakerContact">) {
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
      {hasCaretaker && caretakerContact ? (
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
  if (!instructions.mpesaEnabled && !instructions.bankEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Payment instructions have not been published yet.
      </p>
    );
  }

  return (
    <>
      {instructions.mpesaEnabled ? (
        <>
          <ContactField label="M-Pesa name" value={instructions.mpesaBusinessName} />
          <ContactField label="Paybill" value={instructions.mpesaPaybill} />
          <ContactField label="Till" value={instructions.mpesaTillNumber} />
          <ContactField label="M-Pesa account" value={instructions.mpesaAccountNumber} />
        </>
      ) : null}
      {instructions.bankEnabled ? (
        <>
          <ContactField label="Bank" value={instructions.bankName} />
          <ContactField label="Account name" value={instructions.bankAccountName} />
          <ContactField label="Account number" value={instructions.bankAccountNumber} />
        </>
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
  const hasPaymentInstructions =
    instructions.mpesaEnabled || instructions.bankEnabled;
  const hasCaretaker = Boolean(
    caretakerContact?.fullName ||
      caretakerContact?.phone ||
      caretakerContact?.email,
  );

  if (!hasOrgContact && !hasPaymentInstructions && !hasCaretaker) {
    return null;
  }

  if (layout === "compact") {
    return (
      <section className={panelShellClassName}>
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Property office
          </p>
          <h2 className="mt-1 text-sm font-semibold text-foreground">
            Contact & payments
          </h2>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          {hasOrgContact || hasCaretaker ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Office
              </div>
              <div className="space-y-2.5">
                <OfficeFields org={org} caretakerContact={caretakerContact} />
              </div>
            </div>
          ) : null}

          {hasPaymentInstructions ? (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                Payments
              </div>
              <div className="space-y-2.5">
                <PaymentFields instructions={instructions} />
              </div>
              <Link
                href="/dashboard/tenant/payments"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary/80"
              >
                Open payments
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={panelShellClassName}>
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Property office
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
            Contact & payment details
          </h2>
        </div>
        <Link
          href="/dashboard/tenant/payments"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted/30"
        >
          View payments
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {hasOrgContact ? (
          <div className="space-y-3 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              Office contact
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <ContactField label="Organisation" value={org.name} />
              <ContactField label="Phone" value={org.phone} />
              <ContactField label="Email" value={org.email} />
              <ContactField label="Address" value={org.address} />
            </div>
          </div>
        ) : null}

        {hasCaretaker && caretakerContact ? (
          <div className="space-y-3 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              On-site caretaker
            </div>
            <div className="grid gap-3">
              <ContactField label="Name" value={caretakerContact.fullName} />
              <ContactField label="Phone" value={caretakerContact.phone} />
              <ContactField label="Email" value={caretakerContact.email} />
            </div>
          </div>
        ) : null}

        {hasPaymentInstructions ? (
          <div className="space-y-3 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Payment instructions
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <PaymentFields instructions={instructions} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}