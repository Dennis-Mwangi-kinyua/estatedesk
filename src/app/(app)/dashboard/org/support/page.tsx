import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { SupportForm } from "./support-form";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function OrgSupportPage() {
  const session = await requireManagementAccess();
  const messages = await prisma.platformMessage.findMany({
    where: {
      orgId: session.activeOrgId!,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <section className="ios-panel rounded-[28px] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Platform support
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
          Message the platform
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          Send billing, access, and technical requests directly to platform
          administrators.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="ios-card rounded-[28px] p-5">
          <SupportForm />
        </div>

        <aside className="ios-card rounded-[28px] p-5">
          <h2 className="text-base font-semibold text-neutral-950">
            Recent messages
          </h2>
          <div className="mt-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-neutral-500">No messages sent yet.</p>
            ) : (
              messages.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-neutral-950">
                      {item.subject}
                    </p>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-neutral-500">
                    {item.message}
                  </p>
                  <p className="mt-2 text-[11px] text-neutral-400">
                    {formatDate(item.createdAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
