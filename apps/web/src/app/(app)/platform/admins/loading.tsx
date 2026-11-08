export default function LoadingPlatformAdmins() {
  return (
    <div role="status" aria-label="Loading platform admins" className="mx-auto w-full max-w-6xl space-y-6">
      <span className="sr-only">Loading platform admins…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="space-y-3"><div className="h-8 w-56 rounded-lg bg-muted" /><div className="h-4 w-3/4 rounded bg-muted" /></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 rounded-2xl border bg-muted/40" />)}</div>
        <div className="h-44 rounded-2xl border bg-muted/40" />
        <div className="h-24 rounded-2xl border bg-muted/40" />
        <div className="h-72 rounded-2xl border bg-muted/40" />
      </div>
    </div>
  );
}
