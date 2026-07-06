import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { documentVerificationPath } from "@/lib/documents/identity";
import type { TenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import { panelShellClassName } from "./leases-ui";

type LeaseVerificationPanelProps = {
  leaseDocuments: TenantPortalContext["leaseDocuments"];
};

export function LeaseVerificationPanel({
  leaseDocuments,
}: LeaseVerificationPanelProps) {
  if (leaseDocuments.length === 0) {
    return (
      <section className={`${panelShellClassName} p-5 sm:p-6`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/20 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Document verification
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Download your lease PDF to issue a serialized verification
              certificate with QR code. The serial will appear here after your
              first download.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">
            Document verification
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Each lease PDF includes a serialized certificate. Use the serial or
            verification link to confirm authenticity.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {leaseDocuments.map((doc) => (
          <article
            key={doc.leaseId}
            className="rounded-2xl border border-border bg-muted/10 p-4"
          >
            <p className="text-sm font-semibold text-foreground">
              {doc.propertyName} / Unit {doc.unitName}
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {doc.serialNumber}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={documentVerificationPath(doc.verificationCode)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-muted/30"
              >
                Verify online
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}