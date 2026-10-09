import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  DoorOpen,
  KeyRound,
  WalletCards,
} from "lucide-react";
import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { getTenantNoticesData } from "@/app/(app)/dashboard/tenant/notices/_lib/queries";
import {
  getErrorMessage,
  getSuccessMessage,
} from "@/app/(app)/dashboard/tenant/notices/_lib/helpers";
import { FlashMessages } from "@/app/(app)/dashboard/tenant/notices/_components/flash-messages";
import { GiveNoticeCard } from "@/app/(app)/dashboard/tenant/notices/_components/give-notice-card";
import { GivenNoticesCard } from "@/app/(app)/dashboard/tenant/notices/_components/given-notices-card";

const steps = [
  {
    title: "Give notice",
    description: "Choose your intended handover date and notify management.",
    icon: CalendarDays,
  },
  {
    title: "Attend inspection",
    description: "Agree on a time, provide access, and review the report.",
    icon: ClipboardCheck,
  },
  {
    title: "Review final balance",
    description: "Check rent, utilities, deposit, and any agreed costs.",
    icon: WalletCards,
  },
  {
    title: "Return keys",
    description: "Hand over possession and download your final statement.",
    icon: KeyRound,
  },
] as const;

type MoveOutPageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function TenantMoveOutPage({ searchParams }: MoveOutPageProps) {
  const session = await requireTenantAccess();
  if (!session.userId) redirect("/login");
  if (!session.activeOrgId) redirect("/dashboard/tenant");

  const params = (await searchParams) ?? {};
  const tenant = await getTenantNoticesData(session.userId, session.activeOrgId);
  if (!tenant) {
    return (
      <PageShell>
        <SurfaceCard className="p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">Move-out</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tenant profile not found.</p>
        </SurfaceCard>
      </PageShell>
    );
  }

  const activeLease = tenant.leases[0] ?? null;
  const openStatuses = ["SUBMITTED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"];
  const activeNotice = tenant.moveOutNotices.find(notice => openStatuses.includes(notice.status));
  const latestNotice = activeNotice ?? tenant.moveOutNotices[0] ?? null;
  const stageByStatus: Record<string, number> = {
    SUBMITTED: 0,
    INSPECTION_SCHEDULED: 1,
    INSPECTION_COMPLETED: 2,
    CLOSED: 4,
    CANCELLED: -1,
  };
  const currentStage = latestNotice ? stageByStatus[latestNotice.status] ?? 0 : 0;

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <DoorOpen aria-hidden="true" className="size-4 text-primary" /> Tenant move-out
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Move out, step by step
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Submit your intended date, follow the inspection, review the final settlement, and keep a copy of your handover report. Submitting notice does not end your lease; management confirms the handover.
              </p>
              {activeLease ? (
                <div className="mt-4 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm">
                  <span className="font-semibold text-foreground break-words">{activeLease.unit.property.name}</span>
                  <span className="text-muted-foreground">· Unit {activeLease.unit.houseNo}</span>
                  {activeLease.unit.building?.name ? <span className="text-muted-foreground">· {activeLease.unit.building.name}</span> : null}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  No active lease. You can still review previous move-out records below.
                </p>
              )}
            </div>
            <Link href="/dashboard/tenant" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Tenant dashboard
            </Link>
          </div>
        </SurfaceCard>

        <FlashMessages
          successMessage={getSuccessMessage(params.success)}
          errorMessage={getErrorMessage(params.error)}
        />

        <section aria-labelledby="move-out-steps-title" className="space-y-3">
          <div>
            <h2 id="move-out-steps-title" className="text-lg font-semibold text-foreground">Your move-out journey</h2>
            <p className="mt-1 text-sm text-muted-foreground">Keep these steps together so the final account and key handover are clear.</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const complete = currentStage > index || currentStage === 4;
              const current = currentStage === index && latestNotice?.status !== "CANCELLED";
              return (
                <li key={step.title} className={`min-w-0 rounded-2xl border p-4 ${complete ? "border-emerald-500/30 bg-emerald-500/5" : current ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`flex size-10 items-center justify-center rounded-xl ${complete ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-primary/10 text-primary"}`}>
                      {complete ? <Check aria-hidden="true" className="size-5" /> : <Icon aria-hidden="true" className="size-5" />}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {complete ? "Complete" : current ? "In progress" : "Next"}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <GiveNoticeCard hasActiveLease={Boolean(activeLease)} hasOpenNotice={Boolean(activeNotice)} />
          <GivenNoticesCard
            moveOutNotices={tenant.moveOutNotices}
            activeMoveOutNotices={tenant.moveOutNotices.filter(notice => openStatuses.includes(notice.status)).length}
            closedMoveOutNotices={tenant.moveOutNotices.filter(notice => ["CLOSED", "CANCELLED"].includes(notice.status)).length}
          />
        </section>

        <SurfaceCard className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Before handing over</h2>
          <ul className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
            <li className="rounded-xl border border-border bg-muted/10 p-3">Confirm your notice date against the notice terms in your lease.</li>
            <li className="rounded-xl border border-border bg-muted/10 p-3">Arrange inspection access and keep the inspection report.</li>
            <li className="rounded-xl border border-border bg-muted/10 p-3">Share final meter readings and settle outstanding rent or utility bills.</li>
            <li className="rounded-xl border border-border bg-muted/10 p-3">Return all keys and download the final settlement statement.</li>
          </ul>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
