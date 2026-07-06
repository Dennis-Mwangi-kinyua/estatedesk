import Image from "next/image";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import type { OrgRole } from "@prisma/client";
import { updateUnitVacancyMarketingAction, uploadUnitVacancyImagesAction } from "../actions";
import type { UnitDetailsViewData } from "../_lib/types";
import { DetailItem, formatCurrency, formatDateTime, formatEnumLabel, imageUrl } from "./unit-details-ui";

export function UnitVacancyListingPanel({
  unit,
  currencyCode,
  orgRole,
}: {
  unit: UnitDetailsViewData["unit"];
  currencyCode: string;
  orgRole?: OrgRole | null;
}) {
  const updateMarketingAction = updateUnitVacancyMarketingAction.bind(null, unit.id);
  const uploadImagesAction = uploadUnitVacancyImagesAction.bind(null, unit.id);
  return (
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-900">
                Vacancy listing details
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Photos and public listing fields shown on the vacancies page.
              </p>
              <InAppGuideHint
                topic="vacancies"
                workspace="org"
                orgRole={orgRole}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Rooms" value={unit.roomCount ?? "—"} />
              <DetailItem label="Balcony" value={unit.hasBalcony ? "Yes" : "No"} />
              <DetailItem
                label="Electricity"
                value={unit.electricityBilling || "—"}
              />
              <DetailItem
                label="Service Charge"
                value={
                  unit.serviceCharge
                    ? formatCurrency(unit.serviceCharge, currencyCode)
                    : "—"
                }
              />
              <DetailItem
                label="Garbage Fee"
                value={
                  unit.garbageFee
                    ? formatCurrency(unit.garbageFee, currencyCode)
                    : "—"
                }
              />
              <DetailItem
                label="Security"
                value={
                  unit.securityFee
                    ? formatCurrency(unit.securityFee, currencyCode)
                    : "—"
                }
              />
              <DetailItem
                label="Viewing"
                value={unit.viewingFeeRequired ? "Viewing fee required" : "Free"}
              />
              <DetailItem
                label="Viewing Fee"
                value={
                  unit.viewingFeeAmount
                    ? formatCurrency(unit.viewingFeeAmount, currencyCode)
                    : "—"
                }
              />
              <DetailItem
                label="Public Enquiries"
                value={unit._count.vacancyInquiries}
              />
            </div>

            <form action={updateMarketingAction} className="mt-6 grid gap-4 lg:grid-cols-3">
              <input
                name="roomCount"
                type="number"
                min="0"
                defaultValue={unit.roomCount ?? ""}
                placeholder="Rooms"
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              />
              <input
                name="bedrooms"
                type="number"
                min="0"
                defaultValue={unit.bedrooms ?? ""}
                placeholder="Bedrooms"
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              />
              <input
                name="bathrooms"
                type="number"
                min="0"
                defaultValue={unit.bathrooms ?? ""}
                placeholder="Bathrooms"
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              />
              <select
                name="electricityBilling"
                defaultValue={unit.electricityBilling ?? ""}
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              >
                <option value="">Electricity billing</option>
                <option value="Prepay">Prepay</option>
                <option value="Postpay">Postpay</option>
                <option value="Included">Included</option>
              </select>
              <input
                name="serviceCharge"
                type="number"
                min="0"
                step="0.01"
                defaultValue={unit.serviceCharge ? String(unit.serviceCharge) : ""}
                placeholder="Service charge"
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              />
              <input
                name="garbageFee"
                type="number"
                min="0"
                step="0.01"
                defaultValue={unit.garbageFee ? String(unit.garbageFee) : ""}
                placeholder="Garbage fee"
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              />
              <input
                name="securityFee"
                type="number"
                min="0"
                step="0.01"
                defaultValue={unit.securityFee ? String(unit.securityFee) : ""}
                placeholder="Security fee"
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              />
              <input
                name="viewingFeeAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={unit.viewingFeeAmount ? String(unit.viewingFeeAmount) : ""}
                placeholder="Viewing fee amount"
                className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-500"
              />
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-2 lg:col-span-1">
                <label className="flex items-center gap-2">
                  <input name="hasBalcony" type="checkbox" defaultChecked={unit.hasBalcony} />
                  Balcony exists
                </label>
                <label className="flex items-center gap-2">
                  <input
                    name="viewingFeeRequired"
                    type="checkbox"
                    defaultChecked={unit.viewingFeeRequired}
                  />
                  Viewing fee
                </label>
              </div>
              <textarea
                name="notes"
                defaultValue={unit.notes ?? ""}
                rows={4}
                placeholder="Public and internal property description notes"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500 lg:col-span-3"
              />
              <button className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 lg:w-fit">
                Save listing details
              </button>
            </form>

            <form action={uploadImagesAction} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-900">
                Upload vacancy images
              </label>
              <input
                name="images"
                type="file"
                accept="image/*"
                multiple
                className="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
              <button className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                Upload images
              </button>
            </form>

            {unit.images.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {unit.images.map((asset) => (
                  <div
                    key={asset.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                  >
                    <Image
                      src={imageUrl(asset.key)}
                      alt={asset.fileName}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                <p>No vacancy images uploaded yet.</p>
                <div className="mt-4 flex justify-center">
                  <InAppGuideLink
                    topic="vacancies"
                    workspace="org"
                    orgRole={orgRole}
                    variant="card"
                  />
                </div>
              </div>
            )}

            {unit.vacancyInquiries.length > 0 ? (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Recent public enquiries
                </h4>
                {unit.vacancyInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {inquiry.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {inquiry.phone}
                          {inquiry.email ? ` • ${inquiry.email}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        {formatEnumLabel(inquiry.status)}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {inquiry.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(inquiry.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
  );
}
