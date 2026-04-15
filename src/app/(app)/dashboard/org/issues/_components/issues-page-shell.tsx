import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2f2f7] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 sm:px-6 sm:pt-6 xl:px-8">
        {children}
      </div>
    </div>
  );
}

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[28px] border border-black/5 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border p-4",
        tone === "accent"
          ? "border-neutral-900/10 bg-neutral-900 text-white"
          : "border-black/5 bg-[#fbfbfd]",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-2",
          tone === "accent" ? "text-white/75" : "text-neutral-500",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-9 w-9 items-center justify-center rounded-full",
            tone === "accent" ? "bg-white/15" : "bg-white shadow-sm",
          ].join(" ")}
        >
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <p
        className={[
          "mt-3 text-[16px] font-semibold",
          tone === "accent" ? "text-white" : "text-neutral-950",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}