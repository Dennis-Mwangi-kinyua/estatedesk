export function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-background px-4 py-4 dark:border-emerald-500/30">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ChecklistInput({
  name,
  label,
  photoName,
}: {
  name: string;
  label: string;
  photoName?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          name={name}
          className="h-4 w-4 rounded border-border"
        />
        {label}
      </label>

      {photoName ? (
        <div className="mt-3">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Optional room photo
          </label>
          <input
            type="file"
            name={photoName}
            accept="image/*"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
          />
        </div>
      ) : null}
    </div>
  );
}