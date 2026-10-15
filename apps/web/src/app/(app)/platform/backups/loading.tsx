import { PageHeader } from "../_components/control-plane";

export default function BackupsLoading() {
  return (
    <div className="engineering-workspace mx-auto w-full max-w-7xl space-y-6" aria-busy="true">
      <PageHeader eyebrow="Developer portal" title="Backup and recovery" description="Loading recovery records and backup evidence." />
      <p role="status" className="text-sm text-muted-foreground">Loading backup information…</p>
      <div aria-hidden="true" className="engineering-metrics grid gap-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-2xl border border-border bg-card" />)}
      </div>
    </div>
  );
}
