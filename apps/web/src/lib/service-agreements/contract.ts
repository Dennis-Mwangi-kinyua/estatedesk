export const AGREEMENT_ENTITY = "ESTATEDESK_SERVICE_AGREEMENT";
export const AGREEMENT_VERSION = "2026-10-15.2";
export type AgreementSignature = { name: string; userId: string; signedAt: string; contentHash: string; method?: "TYPED" | "DRAWN" | "UPLOADED"; imageData?: string; imageHash?: string };
export type AgreementData = {
  templateVersion: string; body: string; representative: string;
  lastReminder?: { party: "ORGANIZATION" | "ESTATEDESK"; sentAt: string };
  platformSignature?: AgreementSignature; organizationSignature?: AgreementSignature;
};
export function agreementData(value: unknown): AgreementData {
  if (!value || typeof value !== "object" || !("body" in value) || typeof value.body !== "string") throw Error("Invalid agreement record");
  return value as AgreementData;
}
export function signatureName(value: string, expected: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase() === expected.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
export function agreementTemplate(input: { organization: string; provider: string; contact: string; representative: string; services: string; infrastructure: string; retention: string }) {
  return `ESTATEDESK SERVICE AGREEMENT AND DATA PROCESSING ADDENDUM
Template ${AGREEMENT_VERSION}

PARTIES AND AUTHORITY
${input.provider} (EstateDesk, the Service Provider and Processor) and ${input.organization} (the Customer and Controller) enter into this agreement through their authorized signatories. EstateDesk representative: ${input.representative}. Privacy and incident contact: ${input.contact}. The agreement takes effect when both parties sign. Each signatory confirms authority to bind their organization. Electronic signatures record the authenticated account, consent, time, and hash of the agreed text; they are not a certificate issued by an accredited signature provider.

1. SERVICES AND COMMERCIAL SCHEDULE
${input.services}
The service covers only the scope, fees, support arrangements, and term stated above. Neither party may alter a signed copy. Changes require a new written agreement accepted by both parties. Each party retains its own intellectual property; the Customer retains rights in Customer data. EstateDesk receives permission to process that data solely to perform the agreed services. Either party may request termination under the agreed service schedule; privacy, confidentiality, and legally required recordkeeping obligations survive termination.

2. PROCESSING INSTRUCTIONS AND ROLES
The Customer determines the purposes and lawful basis for its rental-management processing, provides appropriate notices, and issues documented instructions through this agreement, agreed service settings, and authorized support requests. EstateDesk processes Customer personal data only on those instructions, including instructions concerning international transfers, unless applicable law requires otherwise; where permitted, EstateDesk will inform the Customer before such legally required processing. EstateDesk will notify the Customer if an instruction appears to contravene applicable data protection law. EstateDesk does not acquire an independent right to sell Customer personal data or use it for unrelated advertising. Processing of EstateDesk's own account, billing, fraud-prevention, and legal records for its independently determined purposes is governed by its privacy notice and applicable law.

3. SUBJECT MATTER, DURATION, AND DATA SCHEDULE
Purpose: provide the agreed property-management services, support, security, reporting, and recovery. Operations may include collection, recording, storage, organization, retrieval, display, communication on instruction, export, restriction, and deletion. Duration: the service term plus the agreed return/deletion and legally required retention periods.
Data subjects: tenants, prospective tenants, landlords, organization staff, caretakers, service providers, visitors, and short-stay guests to the extent included in the Customer's configuration.
Data categories: contact and identity details; property, unit, occupancy, and lease records; bills, payments, accounting and tax information; maintenance, inspection and communication records; visitor and guest-access records; and account, access, security, and audit records. Identity documents or other sensitive information must be limited to what is necessary and lawfully authorized. The Customer must not upload unrelated sensitive data or children's information without an appropriate legal basis and safeguards.

4. CONFIDENTIALITY AND SECURITY
EstateDesk will restrict access to authorized personnel who need it for the services and are subject to confidentiality obligations. It will apply appropriate technical and organizational safeguards proportionate to risk, including access controls, least privilege, secure transport, logging, vulnerability management, recovery procedures, and incident response. The Customer must manage its users and permissions, protect credentials, and promptly report unauthorized access. Specific controls, hosting, subprocessors, recovery arrangements, and transfer safeguards agreed for this Customer are recorded in Schedule A below; this agreement does not certify infrastructure controls that have not been verified.

5. SUBPROCESSORS AND LOCATIONS
EstateDesk may use only subprocessors identified in Schedule A or subsequently authorized in writing by the Customer. EstateDesk will impose data-protection obligations appropriate to the services and remain responsible for its subprocessors' performance of those obligations. Proposed additions or replacements require prior notice and an opportunity for the Customer to raise reasonable data-protection objections before access is granted. The parties will resolve an objection by an agreed alternative or termination of the affected service. Cross-border processing must have the safeguards required by applicable law; a signature alone is not proof that a transfer safeguard exists.

6. PERSONAL DATA BREACHES
EstateDesk will notify the Customer without delay and, where reasonably practicable, within 48 hours after becoming aware of a personal data breach affecting Customer data. Initial notice may be followed by updates as facts become available and should describe the incident, affected data, likely consequences, response measures, and a contact point. EstateDesk will cooperate with containment, investigation, remediation, and the Customer's notification duties. The Customer remains responsible for assessing notifications to the Office of the Data Protection Commissioner and affected individuals, including the statutory 72-hour authority-notification requirement where applicable. Neither party may delay a required notice merely because an investigation is incomplete.

7. RIGHTS REQUESTS AND REGULATORY ASSISTANCE
EstateDesk will promptly forward requests concerning Customer-controlled data and provide reasonable assistance with access, correction, objection, restriction, portability, deletion, impact assessments, regulator inquiries, and breach obligations. It will not make substantive decisions on such requests on the Customer's behalf without instructions unless legally required. The Customer is responsible for verifying a requester's identity and determining the lawful response.

8. RETURN, DELETION, AND RETENTION
At termination, EstateDesk will make agreed exports available and, at the Customer's choice, return or delete Customer-controlled personal data in accordance with the retention schedule below, unless applicable law requires continued retention. Retained data must remain protected and restricted to the legally required purpose. Backups must expire under the documented backup-retention schedule; if restored, deletion instructions must be reapplied. Legal holds and mandatory tax, tenancy, accounting, audit, and dispute records must be identified rather than silently removed.
Retention and exit schedule: ${input.retention}

9. ACCOUNTABILITY AND AUDIT
EstateDesk will provide information reasonably needed to demonstrate performance of its processing obligations and cooperate with proportionate inspections or audits, subject to confidentiality, security, and protection of other customers' data. The parties will document findings and remediation. Material changes to processing scope, security, locations, or retention require a written update accepted by authorized parties where required.

10. GOVERNING LAW AND ORDER OF PRECEDENCE
The parties will comply with applicable Kenyan law, including the Data Protection Act, 2019 and applicable regulations. Additional mandatory laws applicable to particular processing are not excluded. The parties will first attempt good-faith resolution of disputes; statutory complaints and remedies remain available. For personal-data matters this addendum prevails over conflicting general service terms. No clause excludes obligations or remedies that cannot lawfully be excluded.


11. CUSTOMER RESPONSIBILITY AND INDEMNITY
The Customer is responsible for lawful collection and disclosure of Customer data, the accuracy and lawfulness of its instructions, and the conduct of its authorized users, staff, contractors, and agents. It must configure appropriate user permissions, protect accounts and devices, promptly remove access when staff leave, and secure any data it downloads, exports, prints, shares, or stores outside EstateDesk. It must not disclose credentials, permit unauthorized access, unlawfully upload or disclose personal data, or delete or alter records without authority. The Customer must promptly inform EstateDesk of suspected loss, unauthorized disclosure, account compromise, or other personal data breach and cooperate with containment and evidence preservation.
To the extent permitted by applicable law, the Customer shall indemnify Afrisilicon Technology Limited, trading as EstateDesk, against third-party claims, compensation awarded by a competent court or agreed in an approved settlement, reasonable legal defence costs, and reasonable, documented incident-response and data-recovery costs, but only to the extent caused by the Customer's breach of this agreement, unlawful processing instructions, negligence, wilful misconduct, or the acts or omissions of persons for whom it is legally responsible. Covered events may include accidental or unauthorized deletion, loss of data, credential sharing, unauthorized access, and disclosure of exported or locally held data, where attributable to that Customer conduct. An incident occurring in the Customer's account does not by itself establish Customer fault.
This indemnity does not apply to the extent that loss is caused or contributed to by Afrisilicon's or its subprocessors' breach of their obligations, negligence, wilful misconduct, unlawful processing, or failure to implement the safeguards or recovery arrangements they agreed to provide. Where both parties contribute, responsibility shall be allocated according to their respective contribution. The Customer is not required to indemnify Afrisilicon for regulatory fines or penalties imposed on Afrisilicon for its own non-compliance. Neither this clause nor any service term limits a data subject's statutory rights, restricts the regulator's powers, excuses required breach notifications, or excludes any liability that cannot lawfully be excluded.
Afrisilicon must give the Customer prompt written notice of a claim, provide reasonable supporting evidence, and take reasonable steps to mitigate loss. A delay in notice reduces the Customer's obligation only to the extent it materially prejudices the defence. The parties shall cooperate on the defence; no settlement may admit liability for, impose obligations on, or waive rights of the other party without that party's written consent, which shall not be unreasonably withheld. Recoverable costs must be reasonably incurred, evidenced, and not recovered twice. Disputed responsibility or amounts shall be determined under the dispute provisions and applicable law. This clause survives termination for events occurring during the service term. Agreed processor backup, security, assistance, and recovery duties remain in force; Customer responsibility for its own exports does not replace those duties.

SCHEDULE A — CUSTOMER-SPECIFIC INFRASTRUCTURE AND SAFEGUARDS
${input.infrastructure}

REVIEW AND ACCEPTANCE
The parties must check that their legal names, service terms, processing scope, security measures, subprocessors, locations, transfer safeguards, and retention schedules are accurate before signing. This template requires review for the parties' circumstances and is not a certification of legal compliance.
`;
}

export const ESTATEDESK_DPA_DRAFT = agreementTemplate({
  organization: "[Customer's registered legal name — complete in the organization agreement]",
  provider: "Afrisilicon Technology Limited, trading as EstateDesk",
  contact: "[EstateDesk privacy and incident contact email — required before signing]",
  representative: "[Authorized EstateDesk representative]",
  services: "Complete the customer-specific service scope, fees, term, support arrangements, and termination provisions in the organization agreement. This template is unsigned and does not itself establish a service subscription.",
  infrastructure: "Complete the actual subprocessor register, purposes, locations and countries; approved transfer safeguards; implemented security controls; backup retention and recovery arrangements. No provider or certification is asserted by this blank schedule.",
  retention: "Complete data-category retention periods, the export and deletion window, backup expiry, applicable legal holds, and the exit contact before signing.",
}).replace("ESTATEDESK SERVICE AGREEMENT AND DATA PROCESSING ADDENDUM", "ESTATEDESK DATA PROCESSING AGREEMENT — UNSIGNED TEMPLATE");
