import { requireTenantAccess } from "@/lib/permissions/guards";
import { PageShell, SurfaceCard, StatCard, MutedBand, MutedPanel } from "@/components/theme/ed-dashboard-shell";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  FileText,
  FileImage,
  Download,
  CalendarDays,
  FolderOpen,
} from "lucide-react";
import {
  isPdfLeaseAsset,
  tenantLeaseDownloadPath,
} from "../lease/_lib/download";

const tenantDocumentsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    profileImage: true,
    leases: {
      where: {
        deletedAt: null,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        unit: {
          include: {
            property: true,
            building: true,
          },
        },
        contractDocument: true,
      },
    },
  },
});

type TenantDocumentsResult = Prisma.TenantGetPayload<typeof tenantDocumentsArgs>;

type TenantDocumentItem = {
  id: string;
  title: string;
  type: string;
  mimeType: string | null;
  createdAt: Date;
  url: string | null;
  downloadUrl: string | null;
  category: "Profile Image" | "Lease Document";
  subtitle: string;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDocumentIcon(mimeType: string | null) {
  if (mimeType?.startsWith("image/")) {
    return <FileImage className="h-5 w-5" />;
  }

  return <FileText className="h-5 w-5" />;
}

function getDocumentUrl(asset: { key?: string | null }) {
  if (!asset.key) return null;

  if (asset.key.startsWith("http://") || asset.key.startsWith("https://")) {
    return asset.key;
  }

  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${asset.key}`;
  }

  if (bucket && region) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${asset.key}`;
  }

  return null;
}


function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Documents
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No documents found for your tenant account.
      </p>
    </SurfaceCard>
  );
}

export default async function TenantDocumentsPage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const tenant: TenantDocumentsResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantDocumentsArgs,
  });

  const profileDocuments: TenantDocumentItem[] = tenant?.profileImage
    ? [
        {
          id: tenant.profileImage.id,
          title: tenant.profileImage.fileName,
          type: tenant.profileImage.assetType,
          mimeType: tenant.profileImage.mimeType,
          createdAt: tenant.profileImage.createdAt,
          url: getDocumentUrl(tenant.profileImage),
          downloadUrl: getDocumentUrl(tenant.profileImage),
          category: "Profile Image",
          subtitle: "Tenant profile file",
        },
      ]
    : [];

  const leaseDocuments: TenantDocumentItem[] =
    tenant?.leases
      ?.filter(
        (lease) =>
          lease.contractDocument && isPdfLeaseAsset(lease.contractDocument),
      )
      .map((lease) => ({
        id: lease.contractDocument!.id,
        title: lease.contractDocument!.fileName,
        type: lease.contractDocument!.assetType,
        mimeType: lease.contractDocument!.mimeType ?? "application/pdf",
        createdAt: lease.contractDocument!.createdAt,
        url: tenantLeaseDownloadPath(lease.id, { view: true }),
        downloadUrl: tenantLeaseDownloadPath(lease.id),
        category: "Lease Document" as const,
        subtitle: `${lease.unit.property.name} • Unit ${lease.unit.houseNo}${
          lease.unit.building?.name ? ` • ${lease.unit.building.name}` : ""
        }`,
      })) ?? [];

  const documents = [...profileDocuments, ...leaseDocuments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!tenant || documents.length === 0) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  const latestDocument = documents[0] ?? null;
  const imageCount = documents.filter((doc) =>
    doc.mimeType?.startsWith("image/")
  ).length;
  const leaseDocCount = documents.filter(
    (doc) => doc.category === "Lease Document"
  ).length;

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-4 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Tenant Files
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
                Documents
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                View documents linked to your tenant account, including lease
                files and profile documents.
              </p>
            </div>

            {latestDocument ? (
              <div className="rounded-[24px] bg-white/62 px-4 py-4 shadow-sm ring-1 ring-white/70 backdrop-blur-xl sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Latest Document
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {latestDocument.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(latestDocument.createdAt)}
                </p>
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<FolderOpen className="h-4 w-4" />}
            label="All Documents"
            value={documents.length}
          />
          <StatCard
            icon={<FileText className="h-4 w-4" />}
            label="Lease Files"
            value={leaseDocCount}
          />
          <StatCard
            icon={<FileImage className="h-4 w-4" />}
            label="Images"
            value={imageCount}
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Latest Added"
            value={formatDate(latestDocument?.createdAt)}
          />
        </section>

        <SurfaceCard className="p-4 sm:p-6 xl:p-7">
          <div className="mb-4">
            <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
              My Documents
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a lease PDF to preview it, or download it to save a copy on
              your device.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-[26px] border border-white/80 bg-white/68 p-4 shadow-[0_10px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center ed-theme-muted-panel rounded-[20px] text-foreground/80 shadow-sm">
                    {getDocumentIcon(doc.mimeType)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {doc.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doc.category}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-[20px] bg-card/90 px-3 py-3 ring-1 ring-white/70">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Related To
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {doc.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] bg-card/90 px-3 py-3 ring-1 ring-white/70">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Type
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {doc.type}
                      </p>
                    </div>

                    <div className="rounded-[20px] bg-card/90 px-3 py-3 ring-1 ring-white/70">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Added
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[20px] bg-card/90 px-3 py-3 ring-1 ring-white/70">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      File Format
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {doc.mimeType ?? "Unknown type"}
                    </p>
                  </div>
                </div>

                {doc.url || doc.downloadUrl ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-neutral-50"
                      >
                        <FileText className="h-4 w-4" />
                        Open
                      </a>
                    ) : null}
                    {doc.downloadUrl ? (
                      <a
                        href={doc.downloadUrl}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
