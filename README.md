# EstateDesk

EstateDesk is a Kenya-ready, multi-tenant property operations SaaS platform built to help landlords, property managers, office teams, accountants, caretakers, and tenants manage property workflows from one secure workspace.

It brings together portfolio structure, tenant operations, billing, collections, utility workflows, inspections, notices, service tracking, and role-based collaboration into one modern platform.

## Table of Contents

- [EstateDesk](#estatedesk)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Problem Statement](#problem-statement)
  - [Vision](#vision)
  - [Product Positioning](#product-positioning)
    - [Positioning statement](#positioning-statement)
    - [One-line pitch](#one-line-pitch)
  - [Core Product Pillars](#core-product-pillars)
    - [Portfolio control](#portfolio-control)
    - [Revenue workflows](#revenue-workflows)
    - [Service operations](#service-operations)
    - [Management insight](#management-insight)
  - [Key Capabilities](#key-capabilities)
    - [Portfolio and occupancy](#portfolio-and-occupancy)
    - [Tenant and lease workflows](#tenant-and-lease-workflows)
    - [Charges and billing](#charges-and-billing)
    - [Payments and receipts](#payments-and-receipts)
    - [Water and utility workflows](#water-and-utility-workflows)
    - [Maintenance and operational workflows](#maintenance-and-operational-workflows)
    - [Reporting and controls](#reporting-and-controls)
    - [Notifications and communication](#notifications-and-communication)
  - [Target Users](#target-users)
    - [Organization users](#organization-users)
    - [Platform users](#platform-users)
  - [User Roles and Permissions](#user-roles-and-permissions)
    - [Admin](#admin)
    - [Manager](#manager)
    - [Office](#office)
    - [Accountant](#accountant)
    - [Caretaker](#caretaker)
    - [Tenant](#tenant)
    - [Permission design principles](#permission-design-principles)
    - [Suggested permission groups](#suggested-permission-groups)
    - [Sensitive actions that should always be audited](#sensitive-actions-that-should-always-be-audited)
  - [Kenyan Market Fit](#kenyan-market-fit)
    - [Local relevance areas](#local-relevance-areas)
    - [Why this matters](#why-this-matters)
  - [Workspace and Tenancy Model](#workspace-and-tenancy-model)
    - [Core tenancy rules](#core-tenancy-rules)
    - [Workspace principles](#workspace-principles)
  - [Technical Architecture](#technical-architecture)
    - [System goals](#system-goals)
    - [High-level architecture](#high-level-architecture)

## Overview

EstateDesk is designed as more than a rent or billing tool. It is a connected operating system for property revenue, service delivery, records, and accountability.

The platform is built to help property businesses move away from fragmented operations spread across spreadsheets, chat threads, ledgers, paper files, and disconnected payment records.

EstateDesk centralizes:

- organizations, properties, buildings, and units
- tenants, leases, and occupancy records
- rent and water billing
- payments and receipts
- inspections and issue tracking
- notices and move-out workflows
- role-based execution and visibility
- reporting, history, and operational accountability

## Problem Statement

Property businesses often run core workflows across disconnected systems.

Common pain points include:

- rent and water workflows spread across ledgers, spreadsheets, chats, and mobile money statements
- caretakers and tenants generating critical updates outside the formal system of record
- limited manager visibility into balances, exceptions, unresolved issues, and portfolio health
- weak controls around receipts, notices, payment verification, and workflow accountability
- poor tenant experience as portfolios grow

EstateDesk exists to solve these problems through one organization-aware workspace.

## Vision

The long-term goal of EstateDesk is to become the operational layer for more professional property businesses in Kenya.

The product should feel:

- fast
- clean
- trustworthy
- premium
- mobile-friendly
- operationally powerful
- simple for non-technical users

The product direction combines:

- fintech-grade trust
- clean modern workflows
- Kenya-first operating reality
- strong role-based collaboration
- structured operational records
- scalable multi-tenant SaaS architecture

## Product Positioning

EstateDesk should be understood as a vertical SaaS platform for property operations, tenant workflows, and revenue administration.

### Positioning statement

EstateDesk is a connected operating system for property revenue, service, and accountability.

### One-line pitch

EstateDesk is a Kenya-ready property operations platform that connects landlords, managers, office teams, accountants, caretakers, and tenants around revenue, service, and accountability.

## Core Product Pillars

### Portfolio control

EstateDesk helps organizations structure and manage:

- organizations
- properties
- buildings
- units
- occupancy
- vacancy
- operational assignments

### Revenue workflows

EstateDesk supports:

- recurring rent charges
- deposits
- penalties
- service charges
- balances
- receipts
- payment tracking
- tenant account histories

### Service operations

EstateDesk supports:

- caretaker participation
- issue logging and assignment
- inspections
- notices
- move-out workflows
- field accountability
- status tracking from open to resolved

### Management insight

EstateDesk aims to improve:

- portfolio visibility
- approval and control logic
- audit-sensitive workflows
- linked records and histories
- reporting foundations
- operational confidence

## Key Capabilities

### Portfolio and occupancy

- organization-aware workspace model
- property, building, and unit management
- occupancy and vacancy tracking
- building assignment support
- portfolio-level visibility

### Tenant and lease workflows

- tenant profiles
- next-of-kin support
- company tenant support
- lease creation
- lease renewals
- move-in and move-out lifecycle
- deposit tracking
- contract and record management

### Charges and billing

- monthly rent charge generation
- deposit tracking
- penalties
- service charges
- manual adjustments
- water billing from readings
- recurring billing support
- charge histories and references

### Payments and receipts

- M-Pesa-friendly payment flow
- bank, cash, and manual verification support
- receipt generation
- payment allocation
- partial payment handling
- overpayment handling
- linked payment history

### Water and utility workflows

- reading submission by caretakers or assigned staff
- review and approval flows
- usage-based billing
- tenant bill visibility
- billing traceability
- linked history for dispute resolution

### Maintenance and operational workflows

- issue logging by tenants or staff
- issue priority and assignment
- inspections
- notices
- move-out workflows
- task accountability
- status-based tracking

### Reporting and controls

- role-aware dashboards
- rent collection tracking
- arrears and balances
- occupancy summaries
- payment references
- tax-related reporting support
- issue resolution visibility
- auditability for sensitive actions

### Notifications and communication

- in-app notifications
- email notifications
- SMS support where enabled
- due reminders
- overdue alerts
- water bill alerts
- payment verification alerts
- inspection-related communication

## Target Users

EstateDesk is a multi-user platform, not only a back-office tool.

### Organization users

- Admin
- Manager
- Office
- Accountant
- Caretaker
- Tenant

### Platform users

- Super Admin
- Platform Admin
- User

## User Roles and Permissions

### Admin

Admins need governance, settings control, portfolio visibility, and stronger operational oversight.

Typical responsibilities:

- organization settings
- property setup
- staff access and role assignment
- billing visibility
- approvals and escalations
- reporting access

### Manager

Managers need to monitor execution, occupancy, issues, exceptions, and collections.

Typical responsibilities:

- dashboard monitoring
- issue and inspection oversight
- occupancy and collection follow-up
- notice and workflow coordination

### Office

Office users need structured workflows for records, notices, leases, charges, and recurring operational administration.

Typical responsibilities:

- tenant records
- lease support
- notices
- charge support
- operational updates

### Accountant

Accountants need finance-focused visibility and control.

Typical responsibilities:

- payment verification
- receipts
- balances
- references
- finance-related reporting

### Caretaker

Caretakers need a practical role inside the system for building-level execution.

Typical responsibilities:

- meter readings
- field updates
- issue updates
- inspection support
- assigned building tasks

### Tenant

Tenants need a cleaner service and visibility experience.

Typical responsibilities:

- view bills
- view receipts
- report issues
- follow notice updates
- confirm payments where relevant

### Permission design principles

Permissions should be:

- explicit
- least-privilege by default
- organization-scoped
- server-enforced
- audited for sensitive actions

### Suggested permission groups

- `organizations.read`
- `organizations.update`
- `members.read`
- `members.manage`
- `properties.read`
- `properties.manage`
- `units.read`
- `units.manage`
- `tenants.read`
- `tenants.manage`
- `leases.read`
- `leases.manage`
- `charges.read`
- `charges.manage`
- `payments.read`
- `payments.verify`
- `payments.manage`
- `water.readings.submit`
- `water.readings.review`
- `water.bills.manage`
- `issues.read`
- `issues.manage`
- `inspections.manage`
- `moveouts.manage`
- `notices.manage`
- `reports.read`
- `audit.read`
- `subscriptions.manage`
- `platform.manage`

### Sensitive actions that should always be audited

- role changes
- organization access changes
- charge deletion or reversal
- payment verification and reversal
- subscription changes
- lease termination
- move-out closure
- support overrides if ever added

## Kenyan Market Fit

EstateDesk is designed around real Kenyan operating patterns.

### Local relevance areas

- M-Pesa-friendly collections
- caretaker-led field participation
- water billing and utility recovery
- portfolio growth from one building to many
- increasing demand for professional records, receipts, notices, and controls

### Why this matters

- mobile money remains central to collection behavior
- caretakers often hold practical operational knowledge
- utility disputes can affect trust and revenue
- portfolios expand gradually
- clients increasingly expect structured service and records

## Workspace and Tenancy Model

EstateDesk follows a multi-tenant SaaS model where every business object belongs to an organization.

### Core tenancy rules

- every business record belongs to an organization
- users can only access organizations they belong to
- sessions should resolve an active organization context
- all queries and mutations should enforce organization scoping
- no client-supplied organization identifier should be trusted without membership validation

### Workspace principles

- each organization is isolated
- users operate within a scoped workspace context
- dashboards adapt to the user’s role
- records, staff data, and tenant data should never leak across organizations
- authorization should be validated at the server boundary

## Technical Architecture

EstateDesk is designed as a modular, multi-tenant SaaS application built around organizations, properties, buildings, units, tenants, leases, billing workflows, payment tracking, service operations, and permissioned dashboards.

### System goals

The architecture should support:

- organization isolation
- role-based access control
- operational traceability
- scalable feature growth
- auditable workflows
- SaaS billing and platform administration
- responsive experiences for office staff, caretakers, and tenants

### High-level architecture

```text
Users
 ├─ Platform admin
 ├─ Organization admin
 ├─ Manager
 ├─ Office staff
 ├─ Accountant
 ├─ Caretaker
 └─ Tenant
        |
        v
Next.js App Router UI
        |
        v
Server Actions / Route Handlers
        |
        v
Authorization + RBAC Layer
        |
        v
Business Modules
 ├─ Organizations
 ├─ Properties
 ├─ Buildings
 ├─ Units
 ├─ Tenants
 ├─ Leases
 ├─ Charges
 ├─ Water
 ├─ Water Bills
 ├─ Payments
 ├─ Issues
 ├─ Inspections
 ├─ Move-outs
 ├─ Notices
 ├─ Notifications
 ├─ Taxes
 ├─ Settings
 ├─ Subscriptions
 ├─ Audit
 └─ Platform
        |
        v
Prisma ORM
        |
        v
PostgreSQL