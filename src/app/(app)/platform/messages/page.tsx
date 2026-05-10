import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function PlatformMessagesPage() {
  const messages = await prisma.platformMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      org: { select: { name: true, slug: true, status: true } },
      sender: { select: { fullName: true, email: true, phone: true } },
    },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Organization Messages
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Requests and support messages sent from organization dashboards.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {messages.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">No messages yet.</div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <article key={message.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950">
                      {message.subject}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {message.org.name} / {message.org.slug} ·{" "}
                      {message.sender.fullName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600">
                      {message.status}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {message.message}
                </p>

                <p className="mt-4 text-xs text-neutral-500">
                  Contact: {message.sender.email ?? "No email"}
                  {message.sender.phone ? ` · ${message.sender.phone}` : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
