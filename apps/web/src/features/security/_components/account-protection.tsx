import { requireUserSession } from "@/lib/auth/session";
import { getAccountSecurityActivity } from "@/lib/security/account-events";
import { AccountPasswordForm } from "./password-form";

export async function AccountProtection() {
  const session = await requireUserSession();
  const activity = await getAccountSecurityActivity(session.userId);
  const date = (value: string) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
  return <div className="grid min-w-0 gap-5 lg:grid-cols-2">
    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6"><AccountPasswordForm />{activity.passwordChangedAt && <p className="mt-4 text-xs text-muted-foreground">Last changed {date(activity.passwordChangedAt)} (East Africa Time)</p>}</section>
    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6" aria-labelledby="account-security-history"><h2 id="account-security-history" className="text-lg font-semibold">Recent security activity</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Your account’s latest 25 recorded sign-ins and security changes. Review devices you do not recognize below.</p>{activity.events.length ? <ol className="mt-4 divide-y divide-border">{activity.events.map(event => <li key={event.id} className="space-y-1 py-3 [overflow-wrap:anywhere]"><p className="text-sm font-medium">{event.label}</p><time dateTime={event.createdAt} className="block text-xs text-muted-foreground">{date(event.createdAt)} EAT</time><p className="text-xs text-muted-foreground">{event.device}{event.ip ? ` · ${event.ip}` : ""}</p></li>)}</ol> : <p className="mt-5 rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">No account security events have been recorded yet.</p>}</section>
  </div>;
}
