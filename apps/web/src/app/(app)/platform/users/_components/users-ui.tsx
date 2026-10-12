import { PlatformRole } from "@prisma/client";
import { Plus } from "lucide-react";
import { VisualSticker } from "@/components/shared/visual-sticker";
import {
  PLATFORM_ROLE_META,
  ROLE_VALUES,
} from "../_lib/constants";
import Link from "@/components/navigation/workspace-link";

function roleIcon(role: PlatformRole) {
  return <VisualSticker label={role === "USER" ? "user" : "security"} size="xs" />;
}

export function RoleGuidePanel() {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-950">Role guide</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Quick reference for platform access levels.
        </p>
      </div>

      <div className="divide-y divide-neutral-200">
        {ROLE_VALUES.map((roleValue) => (
          <div key={roleValue} className="flex gap-3 px-4 py-3">
            <div className="mt-0.5 shrink-0">
              {roleIcon(roleValue)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {roleValue}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">
                {PLATFORM_ROLE_META[roleValue].title}
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                {PLATFORM_ROLE_META[roleValue].description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CreatePlatformUserPanel() {
  return <section className="rounded-xl border border-border bg-card p-4">
    <div className="mb-3 flex items-center gap-2"><VisualSticker label="add user" size="xs" /><h2 className="text-sm font-semibold text-foreground">Add platform user</h2></div>
    <p className="mb-4 text-xs leading-5 text-muted-foreground">Set up account details and access in a dedicated workspace.</p>
    <Link data-workspace-action="true" href="/platform/users/new" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus aria-hidden="true" className="h-4 w-4" />Add user</Link>
  </section>;
}

export function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 break-all text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

export function PreviewBlock({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: Array<{ id: string; title: string; detail: string }>;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-600">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">None</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-2">
              <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
              <p className="mt-1 truncate text-xs text-neutral-500">{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}