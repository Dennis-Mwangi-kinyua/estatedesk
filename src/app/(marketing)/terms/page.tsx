import { TrustPage } from "@/components/marketing/trust-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Terms of Service",
  description:
    "Professional EstateDesk terms of service covering accounts, customer data, privacy, data processing, deletion, payments, subscriptions, exports, security, and acceptable use.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <TrustPage
      eyebrow="Terms"
      title="Terms of Service"
      description="These Terms of Service govern access to and use of EstateDesk, including account administration, property management workflows, customer data, tenant records, payment operations, retention, deletion, security, and support."
      updatedAt="June 26, 2026"
      sections={[
        {
          title: "1. Acceptance of these terms",
          body: [
            "These Terms of Service form a binding agreement between EstateDesk and the person or organization accessing or using the service. By creating an account, accepting an invitation, signing in, submitting a vacancy enquiry, accessing a tenant or caretaker dashboard, using support channels, or otherwise using EstateDesk, you agree to these terms and to the policies referenced in them.",
            "If you use EstateDesk for a company, landlord, property manager, agency, institution, partnership, estate, or other organization, you represent that you have authority to bind that organization and to manage or process the records you access. In that case, the words \"you\" and \"Customer\" include that organization.",
            "If you do not agree to these terms, you must not access or use EstateDesk. If you are an invited user and you believe you were added to an organization by mistake, you should decline the invitation or contact the organization administrator.",
          ],
        },
        {
          title: "2. Definitions",
          body: [
            "\"EstateDesk\", \"we\", \"us\", or \"our\" means the provider and operator of the EstateDesk property management platform.",
            "\"Service\" means the EstateDesk websites, dashboards, applications, APIs, databases, integrations, reports, vacancy pages, support systems, and related software or services made available by EstateDesk.",
            "\"Customer Data\" means information submitted to, generated in, uploaded to, imported into, stored in, or processed through the Service by or for a customer, including property, tenant, staff, lease, billing, payment, document, inspection, maintenance, notification, and support records.",
            "\"Personal Data\" means information that identifies, relates to, describes, can reasonably be linked to, or could reasonably identify an individual, including account users, tenants, staff, caretakers, landlords, guarantors, next of kin, vacancy leads, and support contacts.",
            "\"Authorized User\" means a person permitted by a customer or EstateDesk to access the Service, including administrators, landlords, property managers, staff, caretakers, tenants, support users, and platform administrators.",
          ],
        },
        {
          title: "3. Description of the service",
          body: [
            "EstateDesk is a property management and rental operations platform. It supports workflows for organizations, buildings, units, tenants, leases, rent tracking, service charges, water billing, payment reconciliation, inspections, maintenance issues, caretakers, staff access, notifications, reports, public vacancy listings, subscription billing, support, and data exports.",
            "The Service is designed to assist with operational recordkeeping and workflow management. EstateDesk does not act as a landlord, property manager, broker, agent, accountant, advocate, financial adviser, tax adviser, insurer, payment institution, credit bureau, or public authority unless expressly agreed in a separate written agreement.",
            "Outputs from the Service, including balances, reports, dashboards, reminders, ledgers, exports, and alerts, depend on customer-entered information, integration status, configuration choices, permissions, and provider data. Customers must review and verify important records before relying on them for legal, financial, tenancy, or operational decisions.",
          ],
        },
        {
          title: "4. Eligibility, accounts, and credentials",
          body: [
            "You must provide accurate registration, invitation, contact, billing, and profile information and keep it current. You may not create accounts using false identities, misleading organization information, unauthorized phone numbers or email addresses, or credentials belonging to another person.",
            "You are responsible for maintaining the confidentiality of passwords, sessions, devices, API keys, recovery channels, and any other authentication method associated with your account. You must promptly notify EstateDesk and the relevant organization administrator if you suspect unauthorized access, credential compromise, or misuse.",
            "You may not share individual user accounts, bypass access controls, transfer credentials, impersonate another person, or allow a person who is not authorized to use your account. EstateDesk may require password changes, session revocation, email verification, additional verification, or other security steps before restoring access.",
            "EstateDesk may refuse, suspend, limit, or revoke access where an account appears inaccurate, inactive, compromised, unauthorized, abusive, unlawful, unpaid, or otherwise risky to the Service, customer data, or other users.",
          ],
        },
        {
          title: "5. Organization administration and permissions",
          body: [
            "Customers are responsible for administering their organizations in EstateDesk. This includes inviting the correct users, assigning appropriate roles, limiting permissions to legitimate operational needs, reviewing access regularly, disabling users who leave or change roles, and maintaining accurate organization details.",
            "Administrators are responsible for activity performed by users they invite or authorize, except to the extent caused by EstateDesk's breach of these terms. Where the Service provides role-based access controls, approval flows, audit logs, or security settings, customers remain responsible for configuring and using them appropriately.",
            "Tenant, caretaker, staff, landlord, platform administrator, and support roles may have different visibility and permissions. A user's access to one organization, property, unit, tenancy, document, or workflow does not create a right to access any other record.",
            "EstateDesk may provide platform-level administrative access for support, security, billing, onboarding, compliance, or operational purposes. Such access should be limited to legitimate business needs and may be reflected in internal logs or platform audit records.",
          ],
        },
        {
          title: "6. Customer responsibilities",
          body: [
            "Customers are responsible for determining whether the Service is suitable for their operations and legal obligations. This includes compliance with tenancy law, data protection law, consumer protection law, employment law, tax obligations, accounting obligations, anti-fraud obligations, payment rules, record retention requirements, and any rules that apply to public property advertising.",
            "Customers must ensure they have a lawful basis to collect, enter, import, upload, disclose, and process Personal Data in EstateDesk. Where notice, consent, contract, legitimate interest assessment, regulatory approval, or another legal basis is required, the customer is responsible for obtaining and documenting it.",
            "Customers are responsible for the accuracy, completeness, legality, reliability, and appropriateness of Customer Data. This includes tenant identity details, next of kin details, lease terms, rent amounts, deposits, arrears, water readings, charges, payment allocations, inspection notes, maintenance records, public listings, staff records, and organization settings.",
            "Customers must not use EstateDesk to make automated decisions about individuals that have legal or similarly significant effects unless they have independently confirmed that the decision process is lawful, fair, explainable, reviewed, and appropriate for their jurisdiction.",
          ],
        },
        {
          title: "7. Information collected and processed",
          body: [
            "EstateDesk may collect and process account information, including names, email addresses, phone numbers, usernames, password credentials in protected form, organization memberships, roles, invitations, verification status, terms acceptance, login activity, sessions, preferences, security metadata, and support communications.",
            "Customer Data may include organization records, building and unit details, landlord details, staff profiles, caretaker assignments, tenant profiles, identification details where provided, next of kin details, lease records, rent and deposit information, charges, invoices, water readings, meter history, inspection records, issue reports, maintenance notes, documents, notifications, vacancy listings, public enquiries, marketing attribution, and operational reports.",
            "Payment and billing data may include payment references, transaction identifiers, amounts, dates, billing periods, payment status, allocation details, provider callbacks, reconciliation notes, subscription plan, billing contact, invoice details, renewal details, trial status, and payment instruction records. EstateDesk does not require ordinary users to store full card numbers, mobile money PINs, online banking passwords, or bank login credentials in the platform.",
            "Technical, diagnostic, and security data may include IP addresses, device information, browser information, approximate network location, request headers, timestamps, referral URLs, pages viewed, feature usage, error logs, rate-limit activity, audit events, provider webhook data, and system performance information.",
          ],
        },
        {
          title: "8. How data is used",
          body: [
            "EstateDesk uses data to provide, maintain, secure, monitor, and improve the Service. This includes authentication, authorization, routing users to the correct dashboards, displaying records, processing workflows, calculating balances, generating reports, managing exports, sending notifications, supporting payments, responding to support requests, preventing abuse, and maintaining audit trails.",
            "EstateDesk may use contact information to send transactional messages, security notices, account alerts, invitation messages, password reset messages, payment or billing notices, support replies, product updates, service notices, and legally required communications.",
            "EstateDesk may use aggregated, statistical, or de-identified information to measure performance, reliability, security, adoption, feature usage, customer needs, and product quality, provided the information does not reasonably identify a particular person, tenant, organization, property, unit, lease, or payment record.",
            "EstateDesk does not sell Customer Data. EstateDesk does not use tenant, lease, property, payment, or staff records for unrelated third-party advertising.",
          ],
        },
        {
          title: "9. Data processing roles and privacy",
          body: [
            "For Customer Data entered by an organization, the organization generally determines the purposes and means of processing, and EstateDesk processes the data to provide the Service. Depending on the applicable law and context, the organization may be considered the data controller or equivalent decision maker, and EstateDesk may be considered a processor or service provider for that Customer Data.",
            "For account administration, platform security, billing, support, service improvement, legal compliance, fraud prevention, public website operation, and direct communications with users, EstateDesk may act as an independent controller or equivalent decision maker.",
            "The Privacy Policy and Data Processing and Retention page provide additional information about privacy practices, processing purposes, retention, exports, deletion, backups, and service providers. If a signed data processing agreement applies to a customer, that agreement will control where it conflicts with these general terms.",
            "Customers are responsible for responding to requests from tenants, staff, caretakers, landlords, guarantors, next of kin, vacancy leads, and other individuals whose Personal Data the customer controls, including requests for access, correction, restriction, objection, portability, or deletion where required by law.",
          ],
        },
        {
          title: "10. Tenant, staff, and vacancy visitor data",
          body: [
            "Tenant and staff records may be created by organizations, imported from customer files, generated through workflows, or created through invitations and dashboard access. The organization remains responsible for notifying those individuals about how their data is collected, used, retained, shared, and protected.",
            "A tenant's access to a dashboard does not transfer ownership or control of the organization's lease, billing, payment, inspection, maintenance, or property records. However, tenants may have rights under applicable law to request access, correction, deletion, or restriction of Personal Data, and those requests should be directed to the relevant organization unless EstateDesk is legally required to respond directly.",
            "Public vacancy visitors may submit enquiry details such as name, phone number, email address, preferred location, message, budget, referral information, listing interest, and communication preferences. These details may be used to respond to enquiries, route leads to the relevant organization or team, attribute referrals, improve listing quality, and prevent spam, fraud, or misuse.",
            "Users must not submit another person's information unless they are authorized to do so and the information is accurate, relevant, and lawful for the intended purpose.",
          ],
        },
        {
          title: "11. Sharing, service providers, and disclosures",
          body: [
            "EstateDesk may share data with vendors and subprocessors that help provide the Service, including hosting providers, database providers, object storage providers, email providers, SMS or WhatsApp messaging providers, payment providers, analytics providers, monitoring providers, security providers, backup providers, and customer support tools.",
            "EstateDesk may disclose information to comply with law, legal process, court order, regulator request, law enforcement request, tax or accounting requirement, security investigation, fraud prevention measure, emergency protection, customer instruction, business transfer, or enforcement of these terms.",
            "Customers may share Customer Data with their own authorized users, landlords, property managers, caretakers, tenants, accountants, auditors, advocates, tax advisers, payment processors, banks, regulators, insurers, contractors, and other recipients. Customers are responsible for ensuring those disclosures are lawful and appropriately protected.",
            "Once a customer exports, downloads, copies, emails, prints, screenshots, or otherwise removes data from EstateDesk, the customer is responsible for the security, retention, accuracy, and lawful use of that data outside the Service.",
          ],
        },
        {
          title: "12. Security, audit logs, and incident response",
          body: [
            "EstateDesk uses administrative, technical, and organizational measures designed to protect the Service, including authentication, protected sessions, password controls, organization-scoped permissions, role-based access controls, private dashboard indexing controls, rate limiting, audit logging, encrypted transport where supported, secure configuration practices, backup practices, and operational monitoring.",
            "No internet-accessible service can be guaranteed to be completely secure. Customers and users must use secure devices and networks, protect credentials, manage roles carefully, disable unused accounts, avoid unnecessary sensitive data, keep exported files secure, and report suspected security issues promptly.",
            "EstateDesk may monitor, investigate, preserve, and review logs, sessions, requests, account activity, provider callbacks, and Customer Data where reasonably necessary to detect abuse, diagnose errors, support customers, enforce these terms, protect the Service, comply with law, or respond to incidents.",
            "If EstateDesk becomes aware of a security incident affecting Customer Data, EstateDesk will take reasonable steps to investigate, contain, mitigate, and notify affected customers or users where required by law or contract. Customers are responsible for providing accurate contact details for security notices.",
          ],
        },
        {
          title: "13. Payments, rent records, and billing workflows",
          body: [
            "EstateDesk may support rent, deposit, utility, service charge, water billing, invoice, payment instruction, payment reconciliation, and subscription workflows. These workflows may depend on customer configuration, tenant records, lease terms, payment provider data, webhook delivery, user action, and third-party availability.",
            "Customers are solely responsible for verifying payment status, reconciling provider statements, correcting allocations, issuing receipts or statements, handling reversals, chargebacks, refunds, disputes, overpayments, underpayments, tax reporting, and compliance with financial, tenancy, consumer, accounting, and payment rules.",
            "EstateDesk is not a bank, mobile money provider, payment institution, escrow agent, debt collector, credit provider, tax authority, or accounting firm. Displayed balances, payment statuses, and reports are operational records and should be verified against source documents and provider statements where accuracy is material.",
            "Payment providers, banks, mobile money networks, messaging providers, and other third parties may delay, reject, reverse, duplicate, or fail to deliver confirmations. EstateDesk is not responsible for losses caused by third-party provider failures, incorrect account numbers, customer configuration errors, or unauthorized payment instructions entered by customer users.",
          ],
        },
        {
          title: "14. Subscriptions, fees, and taxes",
          body: [
            "Access to some features may require a paid plan, active subscription, trial approval, usage entitlement, or separate written agreement. Plans may include limits on organizations, users, properties, units, storage, messages, exports, integrations, support levels, or feature availability.",
            "Customers agree to pay all applicable fees, taxes, charges, renewal amounts, overage fees, and provider costs according to the plan, invoice, order form, or billing terms in effect. Fees are generally non-refundable unless required by law or expressly stated in writing.",
            "EstateDesk may suspend, downgrade, limit, or terminate access for unpaid invoices, failed payments, expired trials, billing disputes that remain unresolved, misuse of trial access, excessive usage, or breach of these terms.",
            "EstateDesk may change pricing, plan features, billing cycles, limits, or subscription terms with reasonable notice. Continued use after the effective date of a pricing or plan change constitutes acceptance of the updated commercial terms.",
          ],
        },
        {
          title: "15. Acceptable use and prohibited conduct",
          body: [
            "You may not use EstateDesk for unlawful, fraudulent, deceptive, discriminatory, harassing, abusive, infringing, unsafe, or unauthorized activity. You may not upload malware, attempt unauthorized access, probe or bypass security controls, overload the Service, scrape data without permission, interfere with other users, reverse engineer non-public systems, or use the Service to build a competing product using non-public platform information.",
            "You may not enter false payment records, manipulate balances, conceal unauthorized actions, impersonate another person, misuse support access, tamper with audit logs, create misleading public listings, submit spam leads, publish unlawful property advertisements, or use the Service to facilitate illegal evictions, harassment, discrimination, bribery, money laundering, or other unlawful conduct.",
            "You may not upload or process data that you do not have the right to use, data that is excessive for the stated purpose, or highly sensitive information unless you have confirmed that processing is lawful and that EstateDesk's available safeguards are appropriate for that use.",
            "EstateDesk may investigate suspected misuse and may remove content, disable integrations, throttle requests, suspend users, preserve evidence, notify customers, notify affected users, or cooperate with lawful authorities where reasonably necessary.",
          ],
        },
        {
          title: "16. Imports, exports, reports, and backups",
          body: [
            "Import tools are provided for convenience. Customers are responsible for validating source files, confirming mappings, reviewing imported records, correcting duplicates, handling rejected rows, and ensuring imported data was collected lawfully.",
            "Exports, downloads, reports, backups, CSV files, archives, and API responses may contain sensitive Personal Data and confidential business records. Customers must restrict export permissions, keep exported files secure, avoid unnecessary sharing, and delete or archive files according to their own retention obligations.",
            "Dashboards and reports may be affected by incomplete data, pending transactions, time zone settings, delayed provider callbacks, role permissions, filters, user entry errors, migration history, archived records, or system processing delays. EstateDesk does not guarantee that reports are suitable for tax filings, court proceedings, audits, or regulated financial reporting without independent review.",
            "EstateDesk may maintain backups and disaster recovery copies for continuity, security, compliance, and recovery purposes. Backup restoration may reintroduce data that was changed or deleted after the backup point unless additional remediation is performed.",
          ],
        },
        {
          title: "17. Retention, correction, deletion, and account closure",
          body: [
            "Customers may request correction, export, restriction, deletion, account closure, or organization closure through available platform tools or official support channels. EstateDesk may require identity verification, administrator approval, written confirmation, billing review, and security checks before acting on the request.",
            "Account deletion or closure may deactivate login access, revoke sessions, disable invitations, remove or anonymize profile details where appropriate, and stop future use of the account. However, if the account is connected to organization history, audit logs, support records, leases, payments, reports, security events, legal obligations, or billing records, EstateDesk may retain limited information necessary to preserve integrity, comply with law, prevent fraud, resolve disputes, or protect other users.",
            "Organization deletion may be limited by active subscriptions, unresolved invoices, pending exports, ongoing support or security investigations, legal holds, retention obligations, or dependencies affecting tenants, staff, leases, payments, inspections, issues, documents, reports, and audit logs.",
            "Tenant, staff, lease, billing, tax, inspection, maintenance, payment, notification, support, and audit records may need to be retained for legal, accounting, tenancy, dispute, compliance, anti-fraud, security, or business continuity purposes. Customers should review deletion requests carefully before records are removed, anonymized, archived, or restricted.",
            "Deleted, deactivated, or anonymized data may remain for a limited period in backups, logs, caches, exported files, provider systems, analytics systems, disaster recovery archives, and legal or audit records until those systems rotate, expire, or are remediated according to applicable retention practices.",
          ],
        },
        {
          title: "18. Customer content and intellectual property",
          body: [
            "Customers retain ownership of Customer Data and customer content submitted to the Service. Customers grant EstateDesk a limited, worldwide, non-exclusive license to host, store, copy, process, transmit, display, back up, secure, troubleshoot, and otherwise use Customer Data as necessary to provide, support, protect, and improve the Service and comply with these terms.",
            "Customers represent that they have all rights, consents, permissions, notices, and legal bases required to submit, upload, import, publish, or process customer content, including property images, logos, lease documents, tenant details, staff details, identification information, vacancy listings, payment records, and support materials.",
            "EstateDesk and its licensors retain all rights in the Service, including software, source code, user interfaces, workflows, designs, databases, documentation, templates, trademarks, service marks, product names, analytics, security systems, and improvements. No rights are granted except as expressly stated in these terms.",
            "Feedback, suggestions, ideas, or improvement requests may be used by EstateDesk without restriction or obligation, provided EstateDesk does not disclose Customer Data in violation of these terms.",
          ],
        },
        {
          title: "19. Third-party services and integrations",
          body: [
            "The Service may interoperate with third-party products or services such as payment processors, mobile money providers, email providers, SMS providers, WhatsApp or messaging platforms, hosting services, databases, object storage, analytics, monitoring, identity tools, and support tools.",
            "Third-party services are governed by their own terms, policies, fees, uptime, security, and processing practices. EstateDesk is not responsible for third-party outages, delays, callbacks, data errors, policy changes, rejected messages, reversed payments, account suspensions, or provider-side security incidents except where caused by EstateDesk's breach of these terms.",
            "Customers authorize EstateDesk to send and receive information from configured third-party services as necessary to provide the relevant integration. Customers are responsible for ensuring that integration credentials, recipient details, payment instructions, phone numbers, email addresses, and provider settings are accurate and authorized.",
          ],
        },
        {
          title: "20. Service availability, changes, and support",
          body: [
            "EstateDesk aims to provide reliable web-based access, but the Service may be unavailable or degraded because of maintenance, upgrades, migrations, bugs, hosting incidents, database incidents, provider outages, network conditions, excessive usage, cyberattacks, security response, legal restrictions, or events outside reasonable control.",
            "EstateDesk may add, change, suspend, rename, redesign, limit, or discontinue features where reasonably necessary for product improvement, security, compliance, provider changes, commercial reasons, or operational reliability. EstateDesk will use reasonable efforts to avoid materially reducing core paid functionality without notice where practical.",
            "Support requests should include the organization, affected workflow, approximate time, user role, relevant record identifiers, safe screenshots where useful, and a clear description of the issue. EstateDesk may access relevant account, audit, configuration, and operational records to diagnose, reproduce, and resolve support issues.",
            "Beta, preview, experimental, pilot, or newly launched features are provided for evaluation and may be changed, limited, interrupted, or discontinued at any time. Customers should not rely on beta features for critical operations without independent verification.",
          ],
        },
        {
          title: "21. Suspension and termination",
          body: [
            "EstateDesk may suspend, restrict, or terminate access immediately if a user or customer breaches these terms, creates security risk, fails to pay required fees, violates law, misuses Personal Data, infringes rights, submits unlawful content, harms platform reliability, misuses support, interferes with other users, or exposes EstateDesk, customers, tenants, staff, or the public to material risk.",
            "Where practical and appropriate, EstateDesk may provide notice and an opportunity to cure. Immediate action may be taken without prior notice where needed to protect security, comply with law, prevent harm, preserve evidence, stop abuse, or protect the Service.",
            "Customers may stop using the Service and may request export, closure, or deletion assistance according to these terms and applicable retention requirements. Fees already incurred remain payable unless otherwise required by law or agreed in writing.",
            "Upon termination, users must stop accessing the Service. Terms concerning data retention, payment obligations, confidentiality, intellectual property, disclaimers, limitations of liability, dispute handling, and any provisions intended to survive will continue to apply.",
          ],
        },
        {
          title: "22. Disclaimers",
          body: [
            "The Service is provided on an \"as is\" and \"as available\" basis to the maximum extent permitted by law. EstateDesk does not warrant that the Service will be uninterrupted, error-free, immune from attack, free from data loss, compatible with every system, or suitable for every customer's legal, tax, accounting, tenancy, property management, reporting, or business requirements.",
            "EstateDesk does not provide legal, tax, accounting, financial, investment, valuation, insurance, lending, credit, eviction, regulatory, or professional advice. Customers should obtain advice from qualified professionals before making decisions that require professional judgment or have legal, financial, or tenancy consequences.",
            "EstateDesk is not responsible for customer-entered errors, incomplete records, unauthorized customer sharing, insecure customer devices, lost credentials, exported files, public listing inaccuracies, third-party provider failures, internet outages, user decisions, or reliance on records that have not been independently verified.",
          ],
        },
        {
          title: "23. Limitation of liability",
          body: [
            "To the maximum extent permitted by law, EstateDesk will not be liable for indirect, incidental, special, consequential, exemplary, punitive, or enhanced damages, including lost profits, lost revenue, loss of goodwill, loss of business opportunity, business interruption, loss of data, cost of replacement services, or damages arising from third-party services, even if EstateDesk has been advised that such damages may occur.",
            "To the maximum extent permitted by law, EstateDesk's total aggregate liability for all claims arising out of or relating to the Service, these terms, or customer use of EstateDesk will not exceed the amounts paid by the customer to EstateDesk for the Service during the three months immediately preceding the event giving rise to the claim, or the minimum amount required by applicable law if greater.",
            "The limitations in this section apply regardless of the legal theory, whether contract, tort, negligence, strict liability, statute, equity, or otherwise, and apply even if a remedy fails of its essential purpose, except where prohibited by law.",
          ],
        },
        {
          title: "24. Indemnity",
          body: [
            "To the extent permitted by law, customers agree to defend, indemnify, and hold EstateDesk harmless from claims, losses, liabilities, damages, penalties, costs, and expenses arising from Customer Data, customer content, public listings, customer instructions, customer use of the Service, customer breach of these terms, customer violation of law, customer failure to obtain required rights or consents, or customer disputes with tenants, staff, landlords, caretakers, payment providers, regulators, or other third parties.",
            "EstateDesk will give reasonable notice of an indemnified claim where legally permitted and may require reasonable cooperation in the defense. Customers may not settle a claim in a way that imposes obligations on EstateDesk or admits fault by EstateDesk without EstateDesk's written consent.",
          ],
        },
        {
          title: "25. Changes to these terms",
          body: [
            "EstateDesk may update these terms to reflect changes in the Service, laws, providers, security practices, commercial terms, or operating requirements. The updated version will be posted on this page with a revised effective date.",
            "Where changes are material, EstateDesk may provide additional notice through the Service, email, account notices, or other reasonable channels. Continued use of the Service after the effective date means the updated terms apply.",
            "If a customer has a separate signed agreement with EstateDesk, that agreement controls to the extent it expressly conflicts with these online terms for that customer.",
          ],
        },
        {
          title: "26. Contact, notices, and legal requests",
          body: [
            "Questions about these terms, privacy, data processing, exports, deletion, account closure, security, billing, or legal requests should be submitted through the contact page or an official EstateDesk support channel.",
            "EstateDesk may send notices by email, dashboard notification, account message, public website update, invoice note, or other reasonable channel. Customers are responsible for keeping account, administrator, billing, and security contact details accurate.",
            "Requests for account deletion, organization deletion, data export, data correction, legal hold, regulator response, or security review may require identity verification, administrator approval, written confirmation, billing review, and time to evaluate retention, legal, security, and operational requirements.",
            "These terms should be read together with the Privacy Policy, Data Processing and Retention page, Security page, and any written order form, service agreement, data processing agreement, or support agreement that applies to a specific customer.",
          ],
        },
      ]}
    />
  );
}
