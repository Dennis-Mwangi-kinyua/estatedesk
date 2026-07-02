import { PushNotificationSettings } from "@/components/pwa/push-notification-settings";
import { getRuntimeEnvReport } from "@/lib/config/env";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { PageHeader, StatCard, Surface } from "../_components/control-plane";

export const dynamic = "force-dynamic";

function statusTone(status: "configured" | "missing" | "missing-required") {
  if (status === "configured") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "missing-required") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusLabel(status: "configured" | "missing" | "missing-required") {
  if (status === "configured") return "Configured";
  if (status === "missing-required") return "Required missing";
  return "Missing";
}

export default async function PlatformSettingsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const envReport = getRuntimeEnvReport();
  const envGroups = Object.entries(
    Object.groupBy(envReport.checks, (check) => check.group),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform settings"
        title="Global configuration"
        description="Runtime configuration visibility for the platform control plane. Secrets are only shown as configured or missing."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Environment" value={process.env.NODE_ENV ?? "development"} />
        <StatCard label="Timezone default" value="Africa/Nairobi" />
        <StatCard label="Currency default" value="KES" />
        <StatCard
          label="Runtime readiness"
          value={envReport.ready ? "Ready" : "Needs attention"}
          note={`${envReport.configured}/${envReport.total} configured`}
        />
      </section>

      <Surface title="Runtime services">
        <div className="space-y-5 p-4">
          {envGroups.map(([group, checks]) => (
            <section key={group} className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-950">
                  {group}
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Secret values are never displayed here.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(checks ?? []).map((check) => (
                  <div
                    key={check.key}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-neutral-950">
                          {check.label}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500">
                          {check.key}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(
                          check.status,
                        )}`}
                      >
                        {statusLabel(check.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-neutral-400">
                      {check.importance}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Surface>

      <PushNotificationSettings />
    </div>
  );
}
