import { previousUnitOccupants } from "./service";
export async function PreviousOccupants({ userId, orgId }: { userId: string; orgId: string }) {
  const occupants = await previousUnitOccupants(userId, orgId);
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-bold">Previous occupants of your unit</h2><p className="mt-2 text-sm text-muted-foreground">Names and length of stay only.</p>{occupants.length ? <ul className="mt-4 divide-y divide-border">{occupants.map((occupant, index) => <li key={index} className="flex flex-wrap justify-between gap-3 py-3"><span>{occupant.name}</span><span className="text-sm text-muted-foreground">{occupant.durationDays.toLocaleString("en-KE")} days</span></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No earlier completed tenancies are recorded for this unit.</p>}</section>;
}
