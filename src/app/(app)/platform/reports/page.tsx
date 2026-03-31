import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

async function getQueuedNotificationsCount() {
  try {
    return await prisma.notification.count({
      where: {
        status: "QUEUED",
      },
    });
  } catch (error) {
    console.error("Failed to load queued notifications count:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return 0;
    }

    throw error;
  }
}

export default async function PlatformReportsPage() {
  const [
    organizations,
    activeSubscriptions,
    totalPayments,
    openIssues,
    queuedNotifications,
  ] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.findMany({
      select: { amount: true },
      take: 500,
      orderBy: { createdAt: "desc" },
    }),
    prisma.issueTicket.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    getQueuedNotificationsCount(),
  ]);

  const paymentVolume = totalPayments.reduce(
    (sum: number, payment) => sum + toNumber(payment.amount),
    0,
  );

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-stone-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,247,242,0.96)_100%)] p-6 shadow-[0_18px_50px_rgba(28,25,23,0.06)] lg:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                Platform reporting
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950 lg:text-[42px]">
                Premium platform reports
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500 lg:text-[15px]">
                High-level operational and billing indicators across the platform,
                presented in a cleaner executive-style reporting layout.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniSummaryCard
                label="Coverage"
                value={formatNumber(organizations)}
                helper="orgs tracked"
              />
              <MiniSummaryCard
                label="Billing"
                value={formatNumber(activeSubscriptions)}
                helper="active plans"
              />
              <MiniSummaryCard
                label="Queue"
                value={formatNumber(queuedNotifications)}
                helper="notifications"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-12">
          <PremiumCard
            className="lg:col-span-5"
            eyebrow="Revenue pulse"
            title="Recent Payment Volume"
            value={formatCurrency(paymentVolume)}
            helper="Based on latest 500 payments"
            tone="featured"
          />

          <PremiumCard
            className="lg:col-span-3"
            eyebrow="Workspace base"
            title="Organizations"
            value={formatNumber(organizations)}
            helper="Active workspaces on platform"
          />

          <PremiumCard
            className="lg:col-span-4"
            eyebrow="Billing health"
            title="Active Subscriptions"
            value={formatNumber(activeSubscriptions)}
            helper="Currently billing successfully"
          />

          <PremiumCard
            className="lg:col-span-6"
            eyebrow="Operations"
            title="Open Issues"
            value={formatNumber(openIssues)}
            helper="Open and in-progress tickets"
            align="row"
          />

          <PremiumCard
            className="lg:col-span-6"
            eyebrow="Messaging"
            title="Queued Notifications"
            value={formatNumber(queuedNotifications)}
            helper="Pending outbound notifications"
            align="row"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InsightPanel
            title="Organizations"
            text="Tracks the number of active workspaces with deleted organizations excluded from the report."
          />
          <InsightPanel
            title="Billing"
            text="Surfaces active subscriptions and recent payment volume for a quick commercial overview."
          />
          <InsightPanel
            title="Operations"
            text="Highlights issue load and queued notifications to give root admins fast operational visibility."
          />
        </section>
      </div>
    </div>
  );
}

function PremiumCard({
  title,
  value,
  helper,
  eyebrow,
  tone = "default",
  align = "stack",
  className = "",
}: {
  title: string;
  value: string | number;
  helper: string;
  eyebrow: string;
  tone?: "default" | "featured";
  align?: "stack" | "row";
  className?: string;
}) {
  const featured = tone === "featured";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[30px] border p-5 sm:p-6 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(28,25,23,0.10)]",
        featured
          ? "border-stone-300 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(244,241,234,0.98)_55%,rgba(238,233,223,1)_100%)] shadow-[0_16px_40px_rgba(28,25,23,0.08)]"
          : "border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#faf8f3_100%)] shadow-[0_10px_28px_rgba(28,25,23,0.05)]",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/90" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl" />

      {align === "row" ? (
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              {eyebrow}
            </p>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-stone-950">
              {title}
            </h3>
            <p className="mt-2 text-sm text-stone-500">{helper}</p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-[30px]">
              {value}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              {eyebrow}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-stone-700">
              {title}
            </h3>
          </div>

          <div className="mt-8">
            <p
              className={[
                "font-semibold tracking-[-0.04em] text-stone-950",
                featured ? "text-3xl sm:text-[40px]" : "text-3xl sm:text-[34px]",
              ].join(" ")}
            >
              {value}
            </p>
            <p className="mt-2 text-sm text-stone-500">{helper}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniSummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8f7f4_100%)] px-4 py-3 shadow-[0_8px_20px_rgba(28,25,23,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight text-stone-950">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-stone-500">{helper}</p>
    </div>
  );
}

function InsightPanel({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)] p-5 shadow-[0_14px_34px_rgba(28,25,23,0.05)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-600">{text}</p>
    </div>
  );
}