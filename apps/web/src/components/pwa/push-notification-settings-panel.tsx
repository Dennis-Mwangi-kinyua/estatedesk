export function PushNotificationSettingsPanel({
  variant = "default",
}: {
  variant?: "default" | "theme";
}) {
  const themed = variant === "theme";
  return (
    <section className={themed ? "p-5 sm:p-6" : "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6"}>
      <h2 className={themed ? "text-base font-semibold text-foreground" : "text-base font-semibold text-slate-950 dark:text-white"}>System notifications</h2>
      <p className={themed ? "mt-1 text-sm leading-6 text-muted-foreground" : "mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300"}>
        Alerts appear in your EstateDesk notifications. Browser and device push alerts are turned off.
      </p>
    </section>
  );
}
