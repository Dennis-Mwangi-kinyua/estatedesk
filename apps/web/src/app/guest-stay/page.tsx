import type { Metadata } from "next";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { getGuestStay } from "@/features/bnb/guest/session";
import { guestLogout } from "@/features/bnb/guest/actions";
import { GuestForm } from "@/features/bnb/guest/forms";
import { CommunityBoard } from "@/features/community/board";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your guest stay", robots: { index: false, follow: false }, alternates: { canonical: "/guest-stay" } };
export default async function GuestStayPage() {
  const stay = await getGuestStay();
  return <><PublicAccessHeader active="stays" /><main className="mx-auto max-w-3xl space-y-6 px-4 py-8"><header><h1 className="text-3xl font-semibold">{stay ? `Welcome, ${stay.guestName}` : "Your EstateDesk stay"}</h1><p className="mt-3 text-muted-foreground">{stay ? stay.listing.title : "Use the temporary access code provided by your host. Access starts at check-in and expires automatically at checkout."}</p></header>{!stay ? <section className="rounded-2xl border bg-card p-6"><GuestForm /></section> : <><section className="space-y-4 rounded-2xl border bg-card p-5"><p className="font-semibold">Checkout: {stay.checkOut.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT</p>{stay.listing.address && <p>{stay.listing.address}</p>}<p className="text-sm text-muted-foreground">Hosted by {stay.listing.org.name}</p><a href={`tel:${stay.listing.contactPhone.replace(/[\s()-]/g, "")}`} className="inline-flex min-h-11 items-center underline">Call your host: {stay.listing.contactPhone}</a></section>{stay.listing.houseRules && <section className="rounded-2xl border bg-card p-5"><h2 className="mb-3 text-xl font-semibold">House rules</h2><p className="whitespace-pre-wrap">{stay.listing.houseRules}</p></section>}<section className="rounded-2xl border bg-card p-5"><h2 className="mb-4 text-xl font-semibold">Guest services</h2><GuestForm request />{stay.requests.map(request => <div key={request.id} className="mt-4 border-t pt-3"><p className="whitespace-pre-wrap text-sm">{request.message}</p><p className="text-xs text-muted-foreground">{request.resolvedAt ? "Resolved" : "Sent to host"}</p></div>)}</section><CommunityBoard reservationId={stay.id} /><form data-logout-form action={guestLogout}><button className="min-h-11 underline">Sign out of guest access</button></form></>}</main><PublicAccessFooter compact /></>;
}
