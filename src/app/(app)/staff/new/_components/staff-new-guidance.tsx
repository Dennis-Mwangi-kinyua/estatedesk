import { STAFF_SETUP_GUIDANCE } from "../_lib/constants";

export function StaffNewGuidance() {
  return (
    <aside className="space-y-3">
      {STAFF_SETUP_GUIDANCE.map((item) => (
        <div
          key={item.title}
          className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </div>
      ))}
    </aside>
  );
}