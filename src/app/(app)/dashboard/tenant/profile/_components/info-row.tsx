import { RevealValue } from "@/components/tenant/reveal-value";

type InfoRowProps = {
  label: string;
  value: string;
  maskedValue?: string;
  reveal?: boolean;
};

export function InfoRow({ label, value, maskedValue, reveal }: InfoRowProps) {
  return (
    <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>

      {reveal ? (
        <RevealValue masked={maskedValue ?? value} value={value} />
      ) : (
        <div className="mt-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {value || "—"}
          </p>
        </div>
      )}
    </div>
  );
}