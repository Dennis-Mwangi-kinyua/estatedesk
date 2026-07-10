import Link from "next/link";
import { deleteUnitAction } from "../../actions";
import type { UnitDetailsViewData } from "../_lib/types";

export function UnitDetailsHeader({ unit }: { unit: UnitDetailsViewData["unit"] }) {
  return (
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Unit {unit.houseNo}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review unit details, leasing activity, billing records, meter
            readings, and maintenance status from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/org/units"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Back to Units
          </Link>
          <Link
            href={`/dashboard/org/properties/${unit.property.id}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            View Property
          </Link>
          <form action={deleteUnitAction}>
            <input type="hidden" name="unitId" value={unit.id} />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
            >
              Delete unit
            </button>
          </form>
        </div>
      </section>
  );
}
