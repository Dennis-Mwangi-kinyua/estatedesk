import { submitAccountingRequestAction } from "../actions";
import { REQUEST_TYPE_LABELS } from "../_lib/constants";
import {
  buttonPrimaryClassName,
  fieldClassName,
  labelClassName,
} from "../_lib/helpers";
import type { FinanceRequestsPageData } from "../_lib/types";

export function FinanceRequestForm({
  data,
  workspace,
}: {
  data: FinanceRequestsPageData;
  workspace: "caretaker" | "org";
}) {
  const { properties } = data;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Submit finance request
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Send a ticket to accounts for reimbursement, vendor payment, petty cash, or
        other spend. You will receive in-app feedback when it is reviewed.
      </p>

      <form action={submitAccountingRequestAction} className="mt-5 space-y-4">
        <input type="hidden" name="workspace" value={workspace} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClassName}>
            Request type
            <select name="type" required className={fieldClassName} defaultValue="OTHER">
              {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Amount
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className={fieldClassName}
            />
          </label>

          <label className={`${labelClassName} sm:col-span-2`}>
            Title
            <input
              name="title"
              required
              minLength={3}
              placeholder="e.g. Plumbing repair at Block B"
              className={fieldClassName}
            />
          </label>

          <label className={`${labelClassName} sm:col-span-2`}>
            Description
            <textarea
              name="description"
              required
              minLength={10}
              rows={4}
              placeholder="What is needed, why, and any receipt or invoice details."
              className={fieldClassName}
            />
          </label>

          <label className={labelClassName}>
            Property
            <select name="propertyId" className={fieldClassName}>
              <option value="">Portfolio-wide</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Reference / receipt no.
            <input name="reference" className={fieldClassName} />
          </label>

          <label className={labelClassName}>
            Vendor name
            <input
              name="vendorName"
              placeholder="If paying a supplier"
              className={fieldClassName}
            />
          </label>

          <label className={labelClassName}>
            Payee name
            <input
              name="payeeName"
              placeholder="If reimbursing a staff member"
              className={fieldClassName}
            />
          </label>

          <label className={`${labelClassName} sm:col-span-2`}>
            Receipt / invoice (optional)
            <input
              name="receipt"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className={`${fieldClassName} file:mr-3 file:rounded-xl file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold`}
            />
          </label>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Attach a photo or PDF receipt up to 5MB. Accountants can open it during
          review.
        </p>

        <button type="submit" className={buttonPrimaryClassName}>
          Submit to accounts
        </button>
      </form>
    </section>
  );
}