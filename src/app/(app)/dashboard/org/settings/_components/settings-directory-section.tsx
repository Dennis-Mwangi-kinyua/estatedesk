import { SETTINGS_NAV_ITEMS } from "../settings-ui-nav";
import { panelShellClassName, SettingsNavCard } from "./settings-ui";

export function SettingsDirectorySection() {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">Settings areas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a section to review or update organization configuration.
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {SETTINGS_NAV_ITEMS.map((item) => (
          <SettingsNavCard
            key={item.id}
            href={item.href}
            label={item.label}
            description={item.description}
            icon={item.icon}
          />
        ))}
      </div>
    </section>
  );
}