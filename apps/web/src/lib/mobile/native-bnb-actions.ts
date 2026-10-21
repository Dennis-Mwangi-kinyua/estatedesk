import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionLink } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { changeBnbStatusAction } from "@/features/bnb/actions";
import { changeReservationAction, resolveGuestRequest, saveReservationAction, updateStaySettings } from "@/features/bnb/reservation-actions";

const canManageBnb = (session: AppSession) => !!session.activeOrgId && ["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? "");

export function nativeBnbRecordActions(session: AppSession, path: string, status?: string): NativeActionLink[] {
  if (path === "/dashboard/org/airbnb/bookings" && canManageBnb(session)) return [];
  if (path !== "/dashboard/org/airbnb" || !canManageBnb(session)) return [];
  return [
    ...(status === "PUBLISHED" ? [{ id: "bnb.pause", title: "Pause listing" }] : status === "PAUSED" || status === "DRAFT" ? [{ id: "bnb.publish", title: "Publish listing" }] : []),
    ...(status !== "ARCHIVED" ? [{ id: "bnb.archive", title: "Archive listing", destructive: true }] : []),
  ];
}

export async function nativeBnbActionDefinition(session: AppSession, path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (path === "/dashboard/org/airbnb/bookings" && canManageBnb(session) && recordId) {
    if (actionId === "bnb.booking.create" || actionId === "bnb.booking.update" || actionId === "bnb.settings") {
      const stayForEdit = actionId === "bnb.booking.update" ? await prisma.bnbReservation.findFirst({ where: { id: recordId, cancelledAt: null, checkedOutAt: null, listing: { orgId: session.activeOrgId!, deletedAt: null } }, select: { id: true, listingId: true, guestName: true, guestPhone: true, checkIn: true, checkOut: true, checkedInAt: true } }) : null;
      if (actionId === "bnb.booking.update" && !stayForEdit) return null;
      const listingId = stayForEdit?.listingId ?? recordId;
      const listing = await prisma.bnbListing.findFirst({ where: { id: listingId, orgId: session.activeOrgId!, deletedAt: null }, select: { id: true, title: true, minimumNights: true, propertyId: true, availableFrom: true } });
      if (!listing) return null;
      if (actionId === "bnb.settings") {
        const properties = await prisma.property.findMany({ where: { orgId: session.activeOrgId!, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } });
        return { id: actionId, title: "Availability settings", description: listing.title, submitLabel: "Save settings", confirmation: "Update this listing’s property link and earliest availability date?", groups: [{ id: "availability", title: "Availability", fields: [
          { name: "listingId", label: "Listing", type: "hidden", defaultValue: listing.id },
          { name: "propertyId", label: "Linked property", type: "select", defaultValue: listing.propertyId ?? "", options: [{ value: "", label: "No linked property" }, ...properties.map(item => ({ value: item.id, label: item.name }))] },
          { name: "availableFrom", label: "Available from", type: "date", defaultValue: listing.availableFrom?.toISOString().slice(0, 10) ?? "" },
        ] }] };
      }
      const isEdit = actionId === "bnb.booking.update";
      const stay = stayForEdit;
      if (isEdit && !stay) return null;
      return { id: actionId, title: isEdit ? "Edit booking" : "New booking", description: `${listing.title} · Minimum stay ${listing.minimumNights} night(s)`, submitLabel: isEdit ? "Save booking" : "Create booking", confirmation: isEdit ? "Save these guest and stay date changes? The system will reject overlapping stays." : "Create this guest booking? The system will check availability and prevent overlapping stays.", groups: [{ id: "booking", title: "Guest & dates", fields: [
        { name: "listingId", label: "Listing", type: "hidden", defaultValue: listing.id },
        ...(stay ? [{ name: "reservationId", label: "Booking", type: "hidden" as const, defaultValue: stay.id }] : []),
        { name: "guestName", label: "Guest name", type: "text", required: true, maxLength: 120, defaultValue: stay?.guestName ?? "" },
        { name: "guestPhone", label: "Guest phone", type: "phone", maxLength: 25, defaultValue: stay?.guestPhone ?? "" },
        { name: "checkIn", label: "Check-in date and time", type: "datetime", required: true, defaultValue: stay?.checkIn.toISOString() ?? "" },
        { name: "checkOut", label: "Check-out date and time", type: "datetime", required: true, defaultValue: stay?.checkOut.toISOString() ?? "" },
      ] }] };
    }
    if (actionId.startsWith("bnb.stay.")) {
      const stay = await prisma.bnbReservation.findFirst({ where: { id: recordId, listing: { orgId: session.activeOrgId!, deletedAt: null } }, select: { id: true, guestName: true, checkedInAt: true, checkedOutAt: true, cancelledAt: true, checkIn: true, checkOut: true } });
      if (!stay || stay.cancelledAt || stay.checkedOutAt) return null;
      const operation = actionId === "bnb.stay.check-in" ? "CHECK_IN" : actionId === "bnb.stay.check-out" ? "CHECK_OUT" : actionId === "bnb.stay.cancel" ? "CANCEL" : actionId === "bnb.stay.issue-access" ? "ISSUE_ACCESS" : actionId === "bnb.stay.revoke-access" ? "REVOKE_ACCESS" : null;
      if (!operation) return null;
      return { id: actionId, title: ({ CHECK_IN: "Check in guest", CHECK_OUT: "Check out guest", CANCEL: "Cancel booking", ISSUE_ACCESS: "Issue guest access", REVOKE_ACCESS: "Revoke guest access" } as const)[operation], description: stay.guestName, submitLabel: "Confirm", confirmation: `Confirm this action for ${stay.guestName}?`, destructive: operation === "CANCEL" || operation === "REVOKE_ACCESS", groups: [{ id: "confirm", title: "Booking action", fields: [{ name: "reservationId", label: "Booking", type: "hidden", defaultValue: stay.id }, { name: "operation", label: "Operation", type: "hidden", defaultValue: operation }] }] };
    }
    if (actionId === "bnb.request.resolve") {
      const request = await prisma.bnbGuestRequest.findFirst({ where: { id: recordId, reservation: { listing: { orgId: session.activeOrgId!, deletedAt: null } } }, select: { id: true, message: true, resolvedAt: true } });
      if (!request || request.resolvedAt) return null;
      return { id: actionId, title: "Resolve guest request", description: request.message, submitLabel: "Mark resolved", confirmation: "Mark this guest request as resolved?", groups: [{ id: "request", title: "Guest request", fields: [{ name: "id", label: "Request", type: "hidden", defaultValue: request.id }] }] };
    }
    return null;
  }
  if (path !== "/dashboard/org/airbnb" || !recordId || !canManageBnb(session)) return null;
  const listing = await prisma.bnbListing.findFirst({ where: { id: recordId, orgId: session.activeOrgId!, deletedAt: null }, select: { title: true, status: true } });
  const action = listing && nativeBnbRecordActions(session, path, listing.status).find(item => item.id === actionId);
  if (!listing || !action) return null;
  const status = actionId === "bnb.pause" ? "PAUSED" : actionId === "bnb.publish" ? "PUBLISHED" : "ARCHIVED";
  return { id: actionId, title: action.title, description: listing.title, submitLabel: action.title, destructive: actionId === "bnb.archive", confirmation: actionId === "bnb.archive" ? `Archive ${listing.title}? This hides the listing and removes it from the active list.` : `${action.title} for ${listing.title}? Publishing requires at least one approved photo.`, groups: [{ id: "status", title: "Listing state", fields: [{ name: "status", label: "Status", type: "hidden", defaultValue: status }] }] };
}

export async function executeNativeBnbAction(session: AppSession, path: string, actionId: string, recordId: string | undefined, form: FormData) {
  if (path === "/dashboard/org/airbnb/bookings" && canManageBnb(session) && recordId) {
    const definition = await nativeBnbActionDefinition(session, path, actionId, recordId);
    if (!definition) return { error: "This booking action is unavailable." };
    if (actionId === "bnb.booking.create" || actionId === "bnb.booking.update") {
      const result = await saveReservationAction({}, form);
      return result.error ? { error: result.error } : { ok: true as const, message: result.message ?? "Booking saved." };
    }
    if (actionId === "bnb.settings") {
      const result = await updateStaySettings({}, form);
      return result.error ? { error: result.error } : { ok: true as const, message: result.message ?? "Availability settings saved." };
    }
    if (actionId.startsWith("bnb.stay.")) {
      const result = await changeReservationAction({}, form);
      return result.error ? { error: result.error } : { ok: true as const, message: result.message ?? "Booking updated.", ...(result.accessCode ? { accessCode: result.accessCode } : {}) };
    }
    if (actionId === "bnb.request.resolve") {
      const result = await resolveGuestRequest({}, form);
      return result.error ? { error: result.error } : { ok: true as const, message: result.message ?? "Guest request resolved." };
    }
  }
  if (!await nativeBnbActionDefinition(session, path, actionId, recordId)) return { error: "This listing action is unavailable." };
  form.set("id", recordId!);
  const result = await changeBnbStatusAction({}, form);
  return result.error ? { error: result.error } : { ok: true as const, message: actionId === "bnb.archive" ? "Listing archived." : actionId === "bnb.publish" ? "Listing published." : "Listing paused." };
}
