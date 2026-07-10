import { FileText, ImageIcon } from "lucide-react";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  formatDocumentType,
  publicAssetUrl,
} from "../_lib/helpers";
import type { CaretakerDocumentsPageData } from "../_lib/types";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export function DocumentsList({
  data,
}: {
  data: CaretakerDocumentsPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="Locker" title="Scoped files" />
      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : data.totalCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            No documents or uploads are available for your assigned units yet.
          </div>
        ) : (
          <>
            {data.documentRecords.map((record) => (
              <article
                key={record.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/10 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {record.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDocumentType(record.documentType)} ·{" "}
                    {record.entityType} · {formatDate(record.issuedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Serial {record.serialNumber}
                  </p>
                </div>
              </article>
            ))}

            {data.assets.map((asset) => (
              <article
                key={asset.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/10 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {asset.fileName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {asset.unit
                      ? `${asset.unit.property.name} · Unit ${asset.unit.houseNo}`
                      : "Unit file"}{" "}
                    · {formatDate(asset.createdAt)}
                  </p>
                  <a
                    href={publicAssetUrl(asset.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-primary"
                  >
                    Open file
                  </a>
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </section>
  );
}