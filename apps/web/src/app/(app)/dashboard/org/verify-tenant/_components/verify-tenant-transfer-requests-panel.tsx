import { approveTenantTransferAction, rejectTenantTransferAction } from "../actions";
import { formatDate, formatStatus } from "../_lib/helpers";
import type { VerifyTenantPageData } from "../_lib/types";

export function VerifyTenantTransferRequestsPanel({
  incomingTransferRequests,
}: {
  incomingTransferRequests: VerifyTenantPageData["incomingTransferRequests"];
}) {
  if (incomingTransferRequests.length === 0) return null;

  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-amber-950">
              Pending transfer requests
            </h3>
            <p className="text-sm text-amber-800">
              Other organisations are asking to transfer tenants previously
              recorded under your organisation.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {incomingTransferRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-amber-200 bg-white p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <p className="font-semibold text-foreground">
                      {request.sourceTenant.fullName}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Requested by {request.targetOrg.name} on{" "}
                      {formatDate(request.requestedAt)}
                    </p>
                    <p className="mt-2 text-sm text-foreground/80">
                      {request.sourceTenant.phone}
                      {request.sourceTenant.email
                        ? ` / ${request.sourceTenant.email}`
                        : ""}
                      {request.sourceTenant.nationalId
                        ? ` / ID ${request.sourceTenant.nationalId}`
                        : ""}
                    </p>
                    {request.sourceTenant.moveOutNotices[0] ? (
                      <p className="mt-2 text-sm text-neutral-600">
                        Move-out:{" "}
                        {formatDate(
                          request.sourceTenant.moveOutNotices[0].moveOutDate,
                        )}{" "}
                        ({formatStatus(
                          request.sourceTenant.moveOutNotices[0].status,
                        )}
                        )
                      </p>
                    ) : null}
                    {request.message ? (
                      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                        {request.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <form action={approveTenantTransferAction}>
                      <input
                        type="hidden"
                        name="transferId"
                        value={request.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
                      >
                        Approve transfer
                      </button>
                    </form>

                    <form action={rejectTenantTransferAction}>
                      <input
                        type="hidden"
                        name="transferId"
                        value={request.id}
                      />
                      <input
                        type="hidden"
                        name="reviewNotes"
                        value="Rejected from verification dashboard."
                      />
                      <button
                        type="submit"
                        className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-red-200 bg-card px-4 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
    </section>
  );
}
