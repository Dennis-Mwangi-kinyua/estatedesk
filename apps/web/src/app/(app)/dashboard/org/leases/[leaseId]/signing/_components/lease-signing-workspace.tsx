import type { Asset } from "@prisma/client";
import { storage } from "@/lib/storage";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/org/properties/_components/properties-ui";
import {
  cancelSigningRequestAction,
  createSigningRequestAction,
  remindSignerAction,
} from "../actions";

type SigningSigner = {
  id: string;
  signingOrder: number;
  role: string;
  name: string;
  status: string;
  signedAt: Date | null;
};

type SigningEvent = {
  id: string;
  eventType: string;
  createdAt: Date;
  ipAddress: string | null;
};

type SigningEnvelope = {
  id: string;
  version: number;
  status: string;
  jurisdiction: string;
  signingOrder: string;
  createdAt: Date;
  expiresAt: Date;
  finalAssetId: string | null;
  sourceDocumentHash: string;
  finalDocumentHash: string | null;
  signers: SigningSigner[];
  events: SigningEvent[];
};

export type LeaseSigningData = {
  lease: {
    id: string;
    tenantId: string;
    tenant: {
      fullName: string;
    };
    unit: {
      houseNo: string;
      property: {
        name: string;
      };
    };
    contractDocument: unknown;
    signatureEnvelopes: SigningEnvelope[];
  };
  members: Array<{
    user: {
      id: string;
      fullName: string;
    };
  }>;
  tenantUsers: Array<{
    userId: string | null;
    fullName: string;
  }>;
  landlords: Array<{
    userId: string;
    displayName: string;
  }>;
  assetMap: Map<string, Asset>;
};

function getFinalAssetUrl(asset: Asset | null | undefined) {
  if (!asset) return null;
  return /^https?:\/\//.test(asset.key)
    ? asset.key
    : storage.getPublicUrl(asset.key);
}

export function LeaseSigningWorkspace({ data }: { data: LeaseSigningData }) {
  const { lease, members, tenantUsers, landlords, assetMap } = data;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-primary">
          {lease.unit.property.name} · Unit {lease.unit.houseNo}
        </p>
        <h1 className="text-3xl font-bold text-foreground">Online lease signing</h1>
        <p className="text-muted-foreground">Tenant: {lease.tenant.fullName}</p>
      </header>

      <form
        action={createSigningRequestAction}
        className={`${panelShellClassName} p-5`}
      >
        <input type="hidden" name="leaseId" value={lease.id} />
        <h2 className="font-bold text-foreground">New signing request</h2>

        {!lease.contractDocument ? (
          <p className="mt-3 text-sm text-destructive">
            Upload a PDF contract before requesting signatures.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-foreground">
              Expires in days
              <input
                name="expiresInDays"
                type="number"
                min="1"
                max="60"
                defaultValue="14"
                className={`${fieldClassName} mt-1`}
              />
            </label>

            <label className="text-sm text-foreground">
              Jurisdiction
              <select name="jurisdiction" className={`${fieldClassName} mt-1`}>
                <option value="KENYA">Kenya</option>
                <option value="UAE">United Arab Emirates</option>
              </select>
            </label>

            <label className="text-sm text-foreground">
              Signing order
              <select name="signingOrder" className={`${fieldClassName} mt-1`}>
                <option value="SEQUENTIAL">Required sequence</option>
                <option value="PARALLEL">Any order</option>
              </select>
            </label>

            <label className="text-sm text-foreground sm:col-span-3">
              Message
              <input
                name="message"
                placeholder="Please review and sign this lease."
                className={`${fieldClassName} mt-1`}
              />
            </label>

            <label className="text-sm text-foreground">
              Additional tenants
              <select
                name="additionalTenantUserIds"
                multiple
                className={`${fieldClassName} mt-1 h-28`}
              >
                {tenantUsers.map((tenant) => (
                  <option key={tenant.userId} value={tenant.userId!}>
                    {tenant.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-foreground">
              Witness
              <select name="witnessUserId" className={`${fieldClassName} mt-1`}>
                <option value="">None</option>
                {members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-foreground">
              Guarantor
              <select name="guarantorUserId" className={`${fieldClassName} mt-1`}>
                <option value="">None</option>
                {members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-foreground">
              Landlord
              <select name="landlordUserId" className={`${fieldClassName} mt-1`}>
                <option value="">None</option>
                {landlords.map((landlord) => (
                  <option key={landlord.userId} value={landlord.userId}>
                    {landlord.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="amendment" />
              Re-sign after lease amendment
            </label>

            <button
              type="submit"
              className={`${buttonPrimaryClassName} sm:col-span-3 sm:w-fit`}
            >
              Create request and sign
            </button>
          </div>
        )}
      </form>

      <section className="space-y-4">
        {lease.signatureEnvelopes.map((envelope) => {
          const finalAsset = envelope.finalAssetId
            ? assetMap.get(envelope.finalAssetId)
            : null;
          const finalUrl = getFinalAssetUrl(finalAsset);

          return (
            <article key={envelope.id} className={`${panelShellClassName} p-5`}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold text-foreground">
                    Version {envelope.version} · {envelope.status.replaceAll("_", " ")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {envelope.jurisdiction} · {envelope.signingOrder} · Created{" "}
                    {envelope.createdAt.toLocaleString("en-KE")} · expires{" "}
                    {envelope.expiresAt.toLocaleDateString("en-KE")}
                  </p>
                </div>

                {finalUrl ? (
                  <a href={finalUrl} className={buttonSecondaryClassName}>
                    Download signed PDF
                  </a>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {envelope.signers
                  .sort((a, b) => a.signingOrder - b.signingOrder)
                  .map((signer) => (
                    <div
                      key={signer.id}
                      className="rounded-lg border border-border bg-muted/10 p-3"
                    >
                      <p className="text-xs text-muted-foreground">
                        Step {signer.signingOrder} · {signer.role}
                      </p>
                      <p className="font-semibold text-foreground">{signer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {signer.status}
                        {signer.signedAt
                          ? ` · ${signer.signedAt.toLocaleString("en-KE")}`
                          : ""}
                      </p>

                      {signer.status === "PENDING" &&
                      ["PENDING", "PARTIALLY_SIGNED"].includes(envelope.status) ? (
                        <form action={remindSignerAction} className="mt-2">
                          <input type="hidden" name="leaseId" value={lease.id} />
                          <input type="hidden" name="envelopeId" value={envelope.id} />
                          <input type="hidden" name="signerId" value={signer.id} />
                          <button
                            type="submit"
                            className="text-xs font-bold text-primary"
                          >
                            Send reminder
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-bold text-foreground">
                  Audit timeline ({envelope.events.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {envelope.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded border border-border bg-muted/10 p-2 text-xs text-foreground"
                    >
                      <b>{event.eventType}</b> ·{" "}
                      {event.createdAt.toLocaleString("en-KE")}
                      {event.ipAddress ? ` · ${event.ipAddress}` : ""}
                    </div>
                  ))}
                </div>
              </details>

              <p className="mt-4 break-all text-xs text-muted-foreground">
                Source SHA-256: {envelope.sourceDocumentHash}
              </p>

              {envelope.finalDocumentHash ? (
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  Final SHA-256: {envelope.finalDocumentHash} ·{" "}
                  <a
                    className="font-bold text-primary"
                    href={`/verify-lease/${envelope.finalDocumentHash}`}
                  >
                    Verify publicly
                  </a>
                </p>
              ) : null}

              {["PENDING", "PARTIALLY_SIGNED"].includes(envelope.status) ? (
                <form
                  action={cancelSigningRequestAction}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  <input type="hidden" name="leaseId" value={lease.id} />
                  <input type="hidden" name="envelopeId" value={envelope.id} />
                  <input
                    name="reason"
                    placeholder="Cancellation reason"
                    className={`${fieldClassName} min-w-[12rem] flex-1`}
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-destructive/40 px-3 py-2 text-sm font-bold text-destructive"
                  >
                    Cancel
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}