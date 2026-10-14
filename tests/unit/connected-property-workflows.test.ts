import assert from "node:assert/strict";
import test from "node:test";
import { stayAvailability, stayIsAccessible, staysOverlap } from "../../apps/web/src/features/bnb/availability";
import { visitorPassState, visitorSchema } from "../../apps/web/src/features/visitors/policy";
import { inspectionDetailHref } from "../../apps/web/src/lib/move-outs/inspection-navigation";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
const now = new Date("2026-10-14T12:00:00Z");
const stay = { checkIn: new Date("2026-10-13T12:00:00Z"), checkOut: new Date("2026-10-15T12:00:00Z"), checkedInAt: now, checkedOutAt: null, cancelledAt: null };
test("occupied date includes contiguous bookings and follows extensions", () => {
  const next = { ...stay, checkedInAt: null, checkIn: stay.checkOut, checkOut: new Date("2026-10-17T12:00:00Z") };
  assert.equal(stayAvailability(null, [next, stay], now).availableAt?.toISOString(), next.checkOut.toISOString());
  assert.equal(stayAvailability(null, [{ ...stay, checkOut: new Date("2026-10-20T12:00:00Z") }], now).label, "Occupied · Available 20 Oct 2026");
  assert.equal(stayAvailability(null, [{ ...stay, checkedOutAt: now }], now).label, "Available now");
  assert.equal(stayAvailability(null, [{ ...stay, cancelledAt: now }], now).label, "Available now");
});
test("guest access ends at checkout and revocation, including extended stays", () => {
  const access = { ...stay, guestTokenHash: "hash" };
  assert.equal(stayIsAccessible(access, now), true);
  assert.equal(stayIsAccessible(access, access.checkOut), false);
  assert.equal(stayIsAccessible({ ...access, checkOut: new Date(+access.checkOut+86400000) }, access.checkOut), true);
  assert.equal(stayIsAccessible({ ...access, guestTokenHash: null }, now), false);
  assert.equal(stayIsAccessible({ ...access, cancelledAt: now }, now), false);
  assert.equal(stayIsAccessible(access, new Date(+access.checkIn-1)), false);
});
test("adjacent bookings do not overlap, but an extension can conflict", () => {
  assert.equal(staysOverlap(stay, { checkIn: stay.checkOut, checkOut: new Date(+stay.checkOut+86400000) }), false);
  assert.equal(staysOverlap(stay, { checkIn: new Date(+stay.checkOut-1), checkOut: new Date(+stay.checkOut+86400000) }), true);
});
test("visitor passes respect time, revocation and single use", () => {
  const pass = { validFrom: new Date(+now-1000), validUntil: new Date(+now+1000), revokedAt: null, admittedAt: null };
  assert.equal(visitorPassState(pass, now), "READY");
  assert.equal(visitorPassState(pass, pass.validUntil), "EXPIRED");
  assert.equal(visitorPassState(pass, new Date(+pass.validFrom-1)), "UPCOMING");
  assert.equal(visitorPassState({ ...pass, admittedAt: now }, now), "ADMITTED");
  assert.equal(visitorPassState({ ...pass, revokedAt: now }, now), "REVOKED");
  assert.equal(visitorSchema.safeParse({ visitorName: "Guest", visitorPhone: "", vehiclePlate: "", validFrom: now.toISOString(), validUntil: new Date(+now+25*3600000).toISOString() }).success, false);
});
test("report back links remain accessible to tenants, caretakers and management", () => {
  for (const role of ["TENANT", "CARETAKER", "ADMIN", "MANAGER", "OFFICE"] as const) {
    const href = inspectionDetailHref(role, "inspection-id");
    assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgRole: role, activeOrgId: "org" }, href), true, `${role}: ${href}`);
  }
});
test("gate and community sections exclude unrelated roles", () => {
  for (const role of ["TENANT", "ACCOUNTANT", "LANDLORD"] as const) assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgRole: role, activeOrgId: "org" }, "/dashboard/gate"), false);
  assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgRole: "OFFICE", activeOrgId: "org" }, "/dashboard/org/community"), true);
  assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgRole: "TENANT", activeOrgId: "org" }, "/dashboard/org/community"), false);
});
