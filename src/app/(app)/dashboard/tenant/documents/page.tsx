import { requireTenantAccess } from "@/lib/permissions/guards";
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

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4f8_46%,#f7f7f5_100%)]">
      <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 sm:py-6 xl:px-8">
        {children}
      </div>
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[30px] border border-white/75 bg-white/78 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:rounded-[34px] ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
      <div className="flex items-center gap-2 text-neutral-500">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm">
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[15px] font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
        Documents
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
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
          category: "Profile Image",
          subtitle: "Tenant profile file",
        },
      ]
    : [];

  const leaseDocuments: TenantDocumentItem[] =
    tenant?.leases
      ?.filter((lease) => lease.contractDocument)
      .map((lease) => ({
        id: lease.contractDocument!.id,
        title: lease.contractDocument!.fileName,
        type: lease.contractDocument!.assetType,
        mimeType: lease.contractDocument!.mimeType,
        createdAt: lease.contractDocument!.createdAt,
        url: getDocumentUrl(lease.contractDocument!),
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
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Tenant Files
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                Documents
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                View documents linked to your tenant account, including lease
                files and profile documents.
              </p>
            </div>

            {latestDocument ? (
              <div className="rounded-[24px] bg-white/62 px-4 py-4 shadow-sm ring-1 ring-white/70 backdrop-blur-xl sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Latest Document
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {latestDocument.title}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
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
            <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
              My Documents
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Tap a card to open a document when a file link is available.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => {
              const cardContent = (
                <div className="rounded-[26px] border border-white/80 bg-white/68 p-4 shadow-[0_10px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:bg-white/85 hover:shadow-[0_16px_44px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-white text-neutral-700 shadow-sm">
                        {getDocumentIcon(doc.mimeType)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {doc.title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {doc.category}
                        </p>
                      </div>
                    </div>

                    {doc.url ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-neutral-700 shadow-sm">
                        <Download className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-[20px] bg-white/78 px-3 py-3 ring-1 ring-white/70">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Related To
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {doc.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[20px] bg-white/78 px-3 py-3 ring-1 ring-white/70">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Type
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {doc.type}
                        </p>
                      </div>

                      <div className="rounded-[20px] bg-white/78 px-3 py-3 ring-1 ring-white/70">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Added
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[20px] bg-white/78 px-3 py-3 ring-1 ring-white/70">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        File Format
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
                        {doc.mimeType ?? "Unknown type"}
                      </p>
                    </div>
                  </div>
                </div>
              );

              return doc.url ? (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {cardContent}
                </a>
              ) : (
                <div key={doc.id}>{cardContent}</div>
              );
            })}
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
