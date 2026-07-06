import type { OrgRole } from "@prisma/client";
import { createOrganizationExpenditureAction } from "../actions";
import { PAYMENT_METHODS } from "../_lib/constants";
import { fieldClassName, formatCategory, labelClassName } from "../_lib/helpers";
import { EXPENDITURE_CATEGORIES, type OrgExpendituresPageData } from "../_lib/types";
import { panelShellClassName } from "./expenditures-ui";

export function ExpendituresForm({
  data,
  defaultDate,
  orgRole,
}: {
  data: OrgExpendituresPageData;
  defaultDate: string;
  orgRole?: OrgRole | null;
}) {
  const { org, tenants, properties } = data;
  const canPostToLedger = orgRole === "ADMIN" || orgRole === "ACCOUNTANT";

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          New expenditure
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {canPostToLedger
            ? "Record a property operating cost or a tenant-linked expense. Mark paid to post to the ledger immediately."
            : "Submit a spend record for accounts approval before it is posted to the ledger."}
        </p>
      </div>

      <form action={createOrganizationExpenditureAction} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            Description
            <input name="description" required className={fieldClassName} />
          </label>

          <label className={labelClassName}>
            Category
            <select name="category" className={fieldClassName} defaultValue="MAINTENANCE">
              {EXPENDITURE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Amount ({org.currencyCode})
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className={fieldClassName}
            />
          </label>

          <label className={labelClassName}>
            Date
            <input
              name="incurredAt"
              type="date"
              required
              defaultValue={defaultDate}
              className={fieldClassName}
            />
          </label>

          <label className={labelClassName}>
            Tenant (optional)
            <select name="tenantId" className={fieldClassName}>
              <option value="">Organization cost</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Property
            <select name="propertyId" className={fieldClassName}>
              <option value="">Not specified</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Payee
            <input name="payee" className={fieldClassName} />
          </label>

          <label className={labelClassName}>
            Reference
            <input name="reference" className={fieldClassName} />
          </label>

          <label className={labelClassName}>
            Payment method
            <select name="paymentMethod" className={fieldClassName} defaultValue="BANK">
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:grid-cols-2">
          {canPostToLedger ? (
            <label className="flex items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                name="paid"
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span>
                <span className="font-medium">Already paid and post to ledger</span>
                <span className="mt-1 block text-muted-foreground">
                  Creates the accounting entry when you save.
                </span>
              </span>
            </label>
          ) : null}

          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              name="chargeable"
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>
              <span className="font-medium">Chargeable to tenant</span>
              <span className="mt-1 block text-muted-foreground">
                Flags the cost for tenant recovery or visibility.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Leave tenant blank for organization costs. Select a tenant to record
            tenant-linked spend.
          </p>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {canPostToLedger ? "Record expenditure" : "Submit for approval"}
          </button>
        </div>
      </form>
    </section>
  );
}