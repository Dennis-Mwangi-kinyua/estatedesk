import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
        contractDocument: true,
      },
    },
  },
});

type TenantDocumentsResult = Prisma.TenantGetPayload<typeof tenantDocumentsArgs>;

export default async function TenantDocumentsPage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const userId = session.userId;
  const orgId = session.activeOrgId;

  const tenant: TenantDocumentsResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantDocumentsArgs,
  });

  const documents = [
    ...(tenant?.profileImage
      ? [
          {
            id: tenant.profileImage.id,
            title: tenant.profileImage.fileName,
            type: tenant.profileImage.assetType,
            mimeType: tenant.profileImage.mimeType,
            createdAt: tenant.profileImage.createdAt,
          },
        ]
      : []),
    ...(tenant?.leases
      ?.filter((lease) => lease.contractDocument)
      .map((lease) => ({
        id: lease.contractDocument!.id,
        title: lease.contractDocument!.fileName,
        type: lease.contractDocument!.assetType,
        mimeType: lease.contractDocument!.mimeType,
        createdAt: lease.contractDocument!.createdAt,
      })) ?? []),
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="mt-1 text-sm text-neutral-500">
          View documents linked to your tenant account
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {documents.length ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-sm text-neutral-500">
                    {doc.type} • {doc.mimeType ?? "Unknown type"}
                  </p>
                </div>

                <p className="text-sm text-neutral-500">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">No documents found.</p>
          )}
        </div>
      </div>
    </div>
  );
}