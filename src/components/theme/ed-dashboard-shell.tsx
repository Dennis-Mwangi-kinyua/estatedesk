import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-24">
      {children}
    </div>
  );
}

export function TenantWorkspace({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["mx-auto w-full max-w-7xl space-y-6 pb-24", className].join(" ")}>
      {children}
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
        "ed-theme-card rounded-[28px] border border-border bg-card/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]",
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
          ? "border-primary/20 bg-primary text-primary-foreground"
          : "ed-theme-card border-border bg-muted/35",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-2",
          tone === "accent" ? "text-primary-foreground/80" : "text-muted-foreground",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9",
            tone === "accent" ? "bg-primary-foreground/15" : "bg-card shadow-sm",
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
          "mt-3 text-[15px] font-semibold sm:text-[16px]",
          tone === "accent" ? "text-primary-foreground" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

export function MutedBand({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function MutedPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "ed-theme-muted-panel rounded-[20px] p-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}