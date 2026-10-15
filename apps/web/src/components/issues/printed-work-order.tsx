import Image from "next/image";
import type { ReactNode } from "react";

type Contact = { fullName: string | null; phone?: string | null; email?: string | null } | null;
export type PrintedWorkOrderData = {
  reference: string; organization: { name: string; address: string | null; phone: string | null; email: string | null };
  title: string; description: string; location: string; priority: string; status: string;
  createdAt: Date; updatedAt: Date; printedAt: Date; printedBy: string;
  assignedTo: Contact; assignedBy: Contact; reportedBy: Contact; tenant: Contact;
  notes: string | null; qrDataUrl: string; issueUrl: string; responseTarget: string | null;
};
const date = (value: Date) => new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(value);

export function PrintedWorkOrder({ data }: { data: PrintedWorkOrderData }) {
  return <article className="work-order-sheet">
    <style>{`
      .work-order-sheet { max-width: 210mm; margin: 24px auto; padding: 12mm; background: #fff; color: #152536; font: 12px/1.55 Arial, sans-serif; box-shadow: 0 4px 24px #15253615; }
      .work-order-sheet * { box-sizing: border-box; }
      .work-order-document { width: 100%; table-layout: fixed; border-collapse: collapse; }
      .work-order-document thead { background: #fff !important; }
      .work-order-sheet .work-order-document td { padding: 0; vertical-align: top; white-space: normal; overflow-wrap: anywhere; }
      .wo-header { background: #fff !important; color: #152536; display: flex; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 3px solid #166354; }
      .wo-header > div { min-width: 0; }
      .wo-header > div:first-child { flex: 1; }
      .wo-header > div:last-child { flex: 0 0 105px; }
      .wo-header h1 { margin: 3px 0; color: #166354; font-size: 27px; line-height: 1.2; letter-spacing: .08em; }
      .wo-brand { font-weight: 700; font-size: 16px; overflow-wrap: anywhere; }
      .work-order-sheet .wo-small { white-space: normal; font-size: 10px; color: #526273; overflow-wrap: anywhere; }
      .wo-reference { margin-top: 8px; font-size: 11px; font-weight: 700; }
      .wo-qr { width: 86px; height: 86px; display: block; margin-left: auto; }
      .wo-qr-caption { max-width: 125px; text-align: right; font-size: 9px; color: #526273; }
      .wo-section { margin-top: 19px; }
      .wo-section h2 { margin: 0 0 10px; color: #166354; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; border-bottom: 1px solid #dce4e8; padding-bottom: 6px; }
      .wo-title { margin: 16px 0 4px; font-size: 19px; font-weight: 700; line-height: 1.4; overflow-wrap: anywhere; }
      .wo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 20px; }
      .wo-grid-three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .wo-contact { min-width: 0; overflow-wrap: anywhere; border: 1px solid #dce4e8; border-radius: 6px; padding: 11px 13px; break-inside: avoid; }
      .wo-label { color: #526273; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
      .wo-value { margin-top: 3px; font-weight: 700; overflow-wrap: anywhere; }
      .wo-copy { white-space: pre-wrap; overflow-wrap: anywhere; }
      .wo-strip { margin-top: 14px; padding: 11px 13px; background: #f0f6f4; border: 1px solid #dce4e8; border-radius: 6px; }
      .wo-signature { min-height: 80px; padding-top: 25px; border-bottom: 1px solid #8394a0; }
      .wo-signatures { break-inside: avoid; }
      .wo-footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 22px; border-top: 1px solid #dce4e8; padding-top: 10px; font-size: 9px; color: #526273; }
      .wo-footer > div { min-width: 0; overflow-wrap: anywhere; }
      @media (max-width: 600px) { .work-order-sheet { margin: 0; padding: 20px; } .wo-grid { grid-template-columns: 1fr; } .wo-header { flex-wrap: wrap; } .wo-footer { flex-direction: column; gap: 8px; } .wo-header > div:first-child { flex-basis: 100%; } .wo-header h1 { font-size: 21px; } }
      @media print { @page { size: A4; margin: 14mm; } .work-order-sheet { width: 100%; max-width: none; padding: 0; margin: 0; box-shadow: none; print-color-adjust: exact; -webkit-print-color-adjust: exact; } .work-order-document thead { display: table-header-group; } .work-order-document tfoot { display: table-footer-group; } .wo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .wo-grid-three { grid-template-columns: repeat(3, minmax(0, 1fr)); } .wo-header { flex-wrap: nowrap; } .wo-footer { flex-direction: row; gap: 20px; } .wo-header > div:first-child { flex-basis: auto; } .wo-header h1 { font-size: 27px; } .wo-footer { padding-bottom: 5px; } }
    `}</style>
    <table className="work-order-document"><thead><tr><td><header className="wo-header"><div><p className="wo-brand">{data.organization.name}</p><p className="wo-small">{[data.organization.address, data.organization.phone, data.organization.email].filter(Boolean).join(" · ")}</p><h1>WORK ORDER</h1><p className="wo-reference">{data.reference}</p></div><div><Image unoptimized width={128} height={128} loading="eager" className="wo-qr" src={data.qrDataUrl} alt="QR code to open the live work order" /><p className="wo-qr-caption">Scan to open the live issue.<br />Authorised sign-in required.</p></div></header></td></tr></thead>
      <tbody><tr><td>
        <h2 className="wo-title">{data.title}</h2><p>{data.location}</p>
        <div className="wo-strip wo-grid wo-grid-three"><Field label="Priority">{data.priority}</Field><Field label="Current status">{data.status.replaceAll("_", " ")}</Field><Field label="Response target">{data.responseTarget ?? "As directed by the office"}</Field></div>
        <section className="wo-section"><h2>Work order details</h2><div className="wo-grid"><Field label="Reported on">{date(data.createdAt)}</Field><Field label="Last updated">{date(data.updatedAt)}</Field></div></section>
        <section className="wo-section"><h2>Assignment and people involved</h2><div className="wo-grid"><Person label="Assigned caretaker" person={data.assignedTo} /><Person label="Assigned by" person={data.assignedBy} /><Person label="Reported by" person={data.reportedBy} /><Person label="Tenant / occupant" person={data.tenant} /></div></section>
        <section className="wo-section"><h2>Scope of work / reported problem</h2><p className="wo-copy">{data.description}</p></section>
        {data.notes ? <section className="wo-section"><h2>Recorded progress / resolution notes</h2><p className="wo-copy">{data.notes}</p></section> : null}
        <section className="wo-section wo-signatures"><h2>Work completion and acknowledgement</h2><p className="wo-small">Record work completed in EstateDesk. Office review and tenant confirmation must follow the live issue workflow.</p><div className="wo-grid"><div><div className="wo-signature" /><p className="wo-small">Caretaker name / signature / date</p></div><div><div className="wo-signature" /><p className="wo-small">Office reviewer name / signature / date</p></div></div></section>
      </td></tr></tbody>
      <tfoot><tr><td><footer className="wo-footer"><div><strong>{data.reference}</strong><br />Issued through EstateDesk · Maintenance work order</div><div>Printed {date(data.printedAt)} (Nairobi)<br />Prepared by {data.printedBy}</div></footer></td></tr></tfoot>
    </table>
  </article>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <div><p className="wo-label">{label}</p><p className="wo-value">{children}</p></div>; }
function Person({ label, person }: { label: string; person: Contact }) { return <div className="wo-contact"><Field label={label}>{person?.fullName || person?.email || "Not recorded"}</Field>{person?.phone ? <p className="wo-small">{person.phone}</p> : null}{person?.email ? <p className="wo-small">{person.email}</p> : null}</div>; }
