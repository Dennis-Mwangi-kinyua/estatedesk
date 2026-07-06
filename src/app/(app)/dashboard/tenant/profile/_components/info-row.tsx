import { SecureRevealValue } from "./secure-reveal-value";

type InfoRowProps = {
  label: string;
  value: string;
  maskedValue?: string;
  reveal?: boolean;
};

export function InfoRow({ label, value, maskedValue, reveal }: InfoRowProps) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      {reveal ? (
        <SecureRevealValue masked={maskedValue ?? value} value={value} />
      ) : (
        <p className="mt-2 text-sm font-semibold text-foreground">
          {value || "—"}
        </p>
      )}
    </div>
  );
}