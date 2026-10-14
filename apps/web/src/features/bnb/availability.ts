export type StayInterval = { checkIn: Date; checkOut: Date; checkedInAt: Date | null; checkedOutAt: Date | null; cancelledAt: Date | null };
export function stayAvailability(availableFrom: Date | null, reservations: StayInterval[], now = new Date()) {
  const active = reservations.filter(r => !r.cancelledAt && !r.checkedOutAt && r.checkOut > now).sort((a,b) => +a.checkIn - +b.checkIn);
  let next = availableFrom && availableFrom > now ? availableFrom : now;
  const occupied = active.some(r => r.checkedInAt && r.checkIn <= now && r.checkOut > now);
  for (const stay of active) {
    if (stay.checkIn <= next && stay.checkOut > next) next = stay.checkOut;
  }
  const blocked = next > now;
  return { occupied, availableAt: blocked ? next : null, label: blocked ? `${occupied ? "Occupied" : "Unavailable"} · Available ${next.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" })}` : "Available now", nextBooking: active.find(r => r.checkIn > next)?.checkIn ?? null };
}
export function stayIsAccessible(stay: { checkIn: Date; checkOut: Date; cancelledAt: Date | null; checkedOutAt: Date | null; guestTokenHash: string | null }, now = new Date()) {
  return !!stay.guestTokenHash && !stay.cancelledAt && !stay.checkedOutAt && stay.checkIn <= now && now < stay.checkOut;
}
export function staysOverlap(a: { checkIn: Date; checkOut: Date }, b: { checkIn: Date; checkOut: Date }) { return a.checkIn < b.checkOut && a.checkOut > b.checkIn; }
