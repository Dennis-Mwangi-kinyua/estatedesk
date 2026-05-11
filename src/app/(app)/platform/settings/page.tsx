import { requirePlatformRole } from "@/lib/permissions/guards";
import { PageHeader, StatCard, Surface } from "../_components/control-plane";

export const dynamic = "force-dynamic";

const envChecks = [
  ["DATABASE_URL", "Database"],
  ["CRON_SECRET", "Cron auth"],
  ["TWILIO_ACCOUNT_SID", "Twilio account"],
  ["TWILIO_SMS_FROM", "SMS sender"],
  ["TWILIO_WHATSAPP_FROM", "WhatsApp sender"],
] as const;

export default async function PlatformSettingsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const configured = envChecks.filter(([key]) => Boolean(process.env[key])).length;

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
        <StatCard label="Configured services" value={`${configured}/${envChecks.length}`} />
      </section>

      <Surface title="Runtime services">
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {envChecks.map(([key, label]) => (
            <div key={key} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-950">{label}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {process.env[key] ? "Configured" : "Missing"} • {key}
              </p>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
