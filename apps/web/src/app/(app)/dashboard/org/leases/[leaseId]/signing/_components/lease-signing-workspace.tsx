import { leaseTenantReadiness, signerCanSign } from "@/lib/leases/signing-workflow";
import type { Asset } from "@prisma/client";
import { encodePublicId } from "@/lib/public-id";
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
  resumeOrganizationSigningAction,
} from "../actions";

type SigningSigner = {
  id: string;
  userId: string | null;
  signingOrder: number;
  role: string;
  name: string;
  status: string;
  signedAt: Date | null;
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
};

export type LeaseSigningData = {
  lease: {
    id: string;
    tenantId: string;
    tenant: {
      fullName: string;
      user: { status: string; lastLoginAt: Date | null } | null;
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
  currentUserId: string;
  query: { error?: string; sent?: string };
};

export function LeaseSigningWorkspace({ data }: { data: LeaseSigningData }) {
  const { lease, members, tenantUsers, landlords, assetMap } = data;

  const readiness = leaseTenantReadiness(lease.tenant.user);
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-primary">
          {lease.unit.property.name} · Unit {lease.unit.houseNo}
        </p>
        <h1 className="text-3xl font-bold text-foreground">Online lease signing</h1>
        <p className="text-muted-foreground">Tenant: {lease.tenant.fullName}</p>
      </header>

      <section className={`${panelShellClassName} p-5`}><h2 className="font-semibold">Tenancy agreement workflow</h2><ol className="mt-3 grid gap-3 text-sm sm:grid-cols-4">{["1. Onboard tenant and share login details", "2. Tenant completes first login", "3. Send agreement; tenant reviews and signs", "4. Organization countersigns; both download the signed PDF with QR verification"].map(step => <li key={step} className="rounded-lg border p-3">{step}</li>)}</ol><p role="status" className="mt-3 text-sm">{readiness || "Tenant has logged in. Prepare the agreement, then send it for the tenant’s signature."}</p></section>
      {data.query.error ? <p role="alert" className="rounded-xl border border-destructive p-4 text-sm">{data.query.error}</p> : null}
      {data.query.sent === "1" ? <p role="status" className="rounded-xl border border-primary p-4 text-sm">Agreement sent to the tenant. We’ll notify the organization representative when it is ready to countersign.</p> : null}
      <form
        action={createSigningRequestAction}
        className={`${panelShellClassName} p-5`}
      >
        <input type="hidden" name="leaseId" value={lease.id} />
        <h2 className="font-bold text-foreground">New signing request</h2>

        {!lease.contractDocument ? (
          <p className="mt-3 text-sm text-destructive">
            Generate or upload a PDF agreement on the lease details page before sending it to the tenant.
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

            <p className="text-sm text-muted-foreground">Signing order: tenant first, organization countersigns. Additional witnesses follow.</p>
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

            <button data-workspace-action="true"
              type="submit"
              disabled={!!readiness}
              className={`${buttonPrimaryClassName} sm:col-span-3 sm:w-fit`}
            >
              Send agreement to tenant
            </button>
          </div>
        )}
      </form>

      <section className="space-y-4">
        {lease.signatureEnvelopes.map((envelope) => {
          const finalAsset = envelope.finalAssetId
            ? assetMap.get(envelope.finalAssetId)
            : null;
          const finalUrl = finalAsset ? `/dashboard/org/leases/${encodePublicId(lease.id, "lease")}/download?envelopeId=${encodeURIComponent(envelope.id)}` : null;

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

              {envelope.status === "COMPLETED" && envelope.finalDocumentHash ? <a href={`/verify-lease/${envelope.finalDocumentHash}`} className="mt-3 inline-block text-sm font-semibold text-primary underline">Verify signed agreement and signatures</a> : null}
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

                      {signer.userId === data.currentUserId && signer.role === "ORGANIZATION" && signerCanSign(signer, envelope.signers) && ["PENDING", "PARTIALLY_SIGNED"].includes(envelope.status) ? <form action={resumeOrganizationSigningAction} className="mt-3"><input type="hidden" name="signerId" value={signer.id} /><button className={buttonPrimaryClassName}>Review and countersign</button></form> : null}
                      {signer.status === "PENDING" &&
                      ["PENDING", "PARTIALLY_SIGNED"].includes(envelope.status) ? (
                        <form action={remindSignerAction} className="mt-2">
                          <input type="hidden" name="leaseId" value={lease.id} />
                          <input type="hidden" name="envelopeId" value={envelope.id} />
                          <input type="hidden" name="signerId" value={signer.id} />
                          <button data-workspace-action="true"
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
                  <button data-workspace-action="true"
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