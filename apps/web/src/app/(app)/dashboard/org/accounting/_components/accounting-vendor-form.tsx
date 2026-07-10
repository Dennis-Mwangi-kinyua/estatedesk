import { createVendorAction } from "../actions";
import {
  buttonSecondaryClassName,
  fieldClassName,
  labelClassName,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";


const vendorFields = [
  ["name", "Vendor name", true],
  ["contactPerson", "Contact person", false],
  ["phone", "Phone", false],
  ["email", "Email", false],
  ["kraPin", "KRA PIN", false],
] as const;

export function AccountingVendorForm({ data }: { data: AccountingPageData }) {
  const { vendors } = data;

  return (
    <section className="rounded-2xl border border-border bg-muted/5 p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Add vendor
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Maintain suppliers and service providers used when posting paid expenses.
      </p>

      <form action={createVendorAction} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {vendorFields.map(([name, label, required]) => (
            <label key={name} className={labelClassName}>
              {label}
              <input
                name={name}
                required={required}
                className={fieldClassName}
              />
            </label>
          ))}
        </div>

        <button type="submit" className={buttonSecondaryClassName}>
          Save vendor
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {vendors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
            No vendors saved yet.
          </p>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-muted/10 px-4 py-3 text-sm"
            >
              <span className="font-medium text-foreground">{vendor.name}</span>
              <span className="text-muted-foreground">
                {vendor.kraPin ?? vendor.phone ?? "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}