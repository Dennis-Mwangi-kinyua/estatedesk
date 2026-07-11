import { KeyRound, Lock, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";
import {
  isPlatformApiKeysUnlocked,
  togglePlatformApiKeyStatusAction,
  unlockPlatformApiKeysPageAction,
  deletePlatformApiKeyAction,
} from "./actions";
import { ApiKeyCreateForm } from "./api-key-create-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  error?: string;
}>;

function permissionSummary(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "No permissions";
  }

  const permissions = value as Record<string, unknown>;
  return Object.entries(permissions)
    .map(([key, item]) =>
      Array.isArray(item) ? `${key}: ${item.join(", ")}` : `${key}: enabled`,
    )
    .join(" | ");
}

export default async function PlatformApiKeysPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const unlocked = await isPlatformApiKeysUnlocked(session.userId);

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <section className="w-full rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-800">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">
            API key management locked
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Enter the platform API management password to view and create public
            vacant-houses API keys.
          </p>

          {params.error === "invalid-password" ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Invalid password.
            </div>
          ) : null}

          {params.error === "missing-password" ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              PLATFORM_API_KEYS_PAGE_PASSWORD is not configured.
            </div>
          ) : null}

          <form action={unlockPlatformApiKeysPageAction} className="mt-5 space-y-3">
            <input
              name="password"
              type="password"
              required
              placeholder="Management password"
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none"
            />
            <button className="h-12 w-full rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800">
              Unlock
            </button>
          </form>

          <p className="mt-4 text-xs text-neutral-500">
            Configure this password with PLATFORM_API_KEYS_PAGE_PASSWORD.
          </p>
        </section>
      </div>
    );
  }

  const [apiKeys, organizations, activeCount, revokedCount] = await Promise.all([
    prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        org: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { fullName: true, email: true } },
      },
    }),
    prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
      take: 500,
    }),
    prisma.apiKey.count({ where: { isActive: true } }),
    prisma.apiKey.count({ where: { isActive: false } }),
  ]);

  const vacantKeys = apiKeys.filter((key) =>
    permissionSummary(key.permissions).includes("vacant_units:read"),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="API management"
        title="Vacant houses API keys"
        description="Create and revoke org-scoped keys for public vacant-house listings. External sites only receive house number, bedrooms, location, and price."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Listed keys" value={apiKeys.length} />
        <StatCard label="Vacant listing keys" value={vacantKeys.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Revoked" value={revokedCount} />
      </section>

      <Surface
        title="Create vacant houses key"
        description="The plain key is shown once. Store it in the external website server environment."
      >
        <div className="p-4">
          <ApiKeyCreateForm organizations={organizations} />
        </div>
      </Surface>

      <Surface title="Public API usage">
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
              <ReceiptText className="h-4 w-4" />
              Endpoint
            </div>
            <code className="mt-3 block overflow-x-auto rounded-xl bg-white px-3 py-3 text-xs text-neutral-900">
              GET /api/public/vacant-houses
            </code>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
              <KeyRound className="h-4 w-4" />
              Header
            </div>
            <code className="mt-3 block overflow-x-auto rounded-xl bg-white px-3 py-3 text-xs text-neutral-900">
              Authorization: Bearer edk_vacant_xxxxx
            </code>
          </div>
        </div>
      </Surface>

      <Surface title="API keys">
        <div className="divide-y divide-neutral-100">
          {apiKeys.map((key) => {
            const isActive = key.isActive;
            const expired = key.expiresAt ? key.expiresAt < new Date() : false;

            return (
              <div key={key.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-950">{key.name}</p>
                    <Badge tone={toneForStatus(isActive && !expired ? "ACTIVE" : "DISABLED")}>
                      {expired ? "EXPIRED" : isActive ? "ACTIVE" : "REVOKED"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {key.org.name} / {key.org.slug}
                  </p>
                  <p className="mt-2 text-sm text-neutral-600">
                    {permissionSummary(key.permissions)}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-neutral-500 sm:grid-cols-3">
                    <span>Created by {key.createdBy.fullName}</span>
                    <span>Last used {formatDateTime(key.lastUsedAt)}</span>
                    <span>Expires {formatDateTime(key.expiresAt)}</span>
                  </div>
                </div>

                <div className="flex items-start justify-end gap-2">
                  <form action={togglePlatformApiKeyStatusAction} className="">
                    <input type="hidden" name="apiKeyId" value={key.id} />
                    <input type="hidden" name="nextActive" value={isActive ? "false" : "true"} />
                    <button className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50">
                      {isActive ? "Revoke" : "Reactivate"}
                    </button>
                  </form>

                  {(!isActive || expired) ? (
                    <form action={deletePlatformApiKeyAction} className="">
                      <input type="hidden" name="apiKeyId" value={key.id} />
                      <button className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}

          {apiKeys.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              No API keys have been created yet.
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
