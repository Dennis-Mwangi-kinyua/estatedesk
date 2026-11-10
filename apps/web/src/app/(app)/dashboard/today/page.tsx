import Link from "next/link";
import { requireAuthenticated, requireOrgMembership } from "@/lib/permissions/guards";
import { getTodaySummary } from "@/features/today/service";
import { NotificationReadButton } from "@/components/notifications/notification-read-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today" };
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireAuthenticated();
  if (session.activeOrgId) await requireOrgMembership();
  const data = await getTodaySummary(session);
  const { view = "all" } = await searchParams;
  const mode = ["overdue", "tasks", "messages"].includes(view) ? view : "all";
  const sections = data.sections.map(section => ({ ...section, items: section.items.filter(item => mode === "overdue" ? item.urgency === "overdue" : mode === "tasks" ? section.id === "tasks" || section.id === "work" : mode === "messages" ? section.id === "messages" : true) }));
  const date = (value: string) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: data.timeZone }).format(new Date(value));
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 py-6 pb-24 [overflow-wrap:anywhere] sm:px-6">
    <nav aria-label="Personal workspace"><Link className="inline-flex min-h-11 items-center rounded-lg border px-4" href="/dashboard">Back to workspace</Link></nav>
    <header><h1 className="text-3xl font-semibold">Today</h1><p className="mt-2 text-muted-foreground">{data.name}, here is what needs your attention.</p><p className="mt-1 text-sm text-muted-foreground">{data.workspace} · Updated {date(data.generatedAt)} (East Africa Time)</p></header>
    <nav aria-label="Today views" className="flex flex-wrap gap-2">{[["all", "Everything"], ["overdue", "Overdue"], ["tasks", "My tasks"], ["messages", "Messages"]].map(([value, title]) => <Link key={value} aria-current={mode === value ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-lg border px-4 ${mode === value ? "bg-primary text-primary-foreground" : "bg-card"}`} href={`/dashboard/today?view=${value}`}>{title}</Link>)}</nav>
    <p className="text-sm text-muted-foreground">Opening an item does not complete it. Use its workspace to save, send or approve changes.</p>
    {!sections.some(section => section.items.length) && <section className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-semibold">Nothing waiting in this view</h2><p className="mt-2 text-muted-foreground">Your current account has no matching items. You can continue in your workspace.</p></section>}
    {sections.filter(section => section.items.length > 0).map(section => <section key={section.id} id={section.id} aria-labelledby={`today-${section.id}`} className="space-y-3"><h2 id={`today-${section.id}`} className="text-xl font-semibold">{section.title}</h2>{section.hasMore && <p className="text-sm text-muted-foreground">More items are available in the workspace.</p>}<ul className="grid gap-3 md:grid-cols-2">{section.items.map(item => <li key={item.id} className="min-w-0 space-y-3 rounded-2xl border bg-card p-5"><h3 className="font-semibold">{item.title}</h3><p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.detail}</p>{item.dueAt && <p className={`text-sm font-medium ${item.urgency === "overdue" ? "text-destructive" : ""}`}>{item.urgency === "overdue" ? "Overdue" : item.urgency === "today" ? "Due today" : "Due"}: {date(item.dueAt)}</p>}<div className="flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium" href={item.href}>{item.action}</Link>{section.id === "messages" && <NotificationReadButton notificationId={item.id.slice("message:".length)} className="min-h-11 rounded-lg border px-4 text-sm">Mark as read</NotificationReadButton>}</div></li>)}</ul></section>)}
  </main>;
}
