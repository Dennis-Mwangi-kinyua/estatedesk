# EstateDesk

EstateDesk is a Kenya-ready, multi-tenant property operations SaaS platform built to help landlords, property managers, accountants, caretakers, and tenants manage property workflows from one secure workspace.

The platform combines portfolio structure, tenant operations, billing, collections, utility workflows, inspections, notices, service tracking, and role-based collaboration into a modern application.

## Table of Contents

- [EstateDesk](#estatedesk)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install Dependencies](#install-dependencies)
    - [Configure Environment](#configure-environment)
    - [Initialize the Database](#initialize-the-database)
    - [Run the Application](#run-the-application)
    - [Build for Production](#build-for-production)
    - [Linting](#linting)
  - [Environment and Configuration](#environment-and-configuration)
    - [Key Environment Variables](#key-environment-variables)
  - [Database and Prisma](#database-and-prisma)
  - [Project Structure](#project-structure)
  - [Architecture](#architecture)
  - [Deployment](#deployment)
  - [Contribution Guidelines](#contribution-guidelines)
  - [Additional Documentation](#additional-documentation)
  - [Product and Market Context](#product-and-market-context)

## Overview

EstateDesk is designed as a connected operating system for property revenue, service, and accountability. It supports:

- organization and portfolio management
- tenant and lease workflows
- rent and utility billing
- payment verification and receipts
- service requests, inspections, and issue tracking
- notices, move-out workflows, and operational transparency
- role-based dashboards and permissions

## Features

- Multi-tenant organization model
- Portfolio structure: properties, buildings, units
- Tenant profiles, next-of-kin support, and company tenants
- Lease lifecycle management
- Recurring rent charges and deposit tracking
- Water reading submission, usage billing, and water bills
- M-Pesa friendly payment tracking and receipt creation
- Maintenance issue tracking and inspection workflows
- Caretaker assignment and field operations support
- Notifications, email/SMS hooks, platform messages, and audit logs

## Tech Stack

- Next.js `16.x` (App Router)
- React `19.x`
- TypeScript `5.x`
- Prisma `7.x`
- PostgreSQL
- Tailwind CSS `4.x`
- `react-hook-form`, `zod`, `framer-motion`, `radix-ui`
- AWS S3-compatible storage support

## Getting Started

### Prerequisites

- Node.js `20.x` or later
- npm `10.x` or later
- PostgreSQL database

### Install Dependencies

```bash
cd /home/baba-nyakio/Desktop/estatedesk-main
npm install
```

### Configure Environment

Copy the example environment file and update it with your local values:

```bash
cp .env.example .env
```

Update the following values at minimum:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `APP_URL`
- `AUTH_SECRET`
- `CRON_SECRET`
- `PLATFORM_API_KEYS_PAGE_PASSWORD`

### Initialize the Database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### Run the Application

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

### Tests

```bash
npm test
```

## Environment and Configuration

Important configuration files and values:

- `.env.example` — local environment variable template
- `prisma.config.ts` — Prisma datasource resolution and migrations
- `next.config.ts` — Next.js configuration entrypoint
- `proxy.ts` — request filtering, security headers, and rate limiting
- `components.json` — Tailwind / shadcn configuration

### Key Environment Variables

- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL URL
- `NEXT_PUBLIC_APP_URL` / `APP_URL` — base URL for the app
- `AUTH_SECRET`, `CRON_SECRET` — secrets used by auth and cron workflows
- `PLATFORM_API_KEYS_PAGE_PASSWORD` — admin-level API key page password
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `ALERT_WEBHOOK_URL` — optional observability and alerting settings
- `NEXT_PUBLIC_STATUS_PAGE_URL` — optional public status page URL
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — storage credentials
- `WHATSAPP_*` — optional WhatsApp messaging integration

## Database and Prisma

Prisma schema is defined in `prisma/schema.prisma` with migrations under `prisma/migrations`.

The codebase uses strong production-safe indexing and a multi-tenant data model.

Key models include:

- `User`
- `Organization`
- `Membership`
- `Property`, `Building`, `Unit`
- `Tenant`, `Lease`
- `RentCharge`, `Payment`, `PaymentAllocation`
- `MeterReading`, `WaterBill`
- `IssueTicket`, `Inspection`
- `Notification`, `AuditLog`, `ApiKey`

## Project Structure

- `src/app` — Next.js App Router pages, layouts, metadata, and route handlers
- `src/components` — shared UI components
- `src/features` — domain feature modules, server actions, and business logic
- `src/hooks` — reusable React hooks
- `src/lib` — shared utilities, auth, Prisma client, and third-party integrations
- `public` — static assets
- `prisma` — schema, migrations, seed data
- `scripts` — utility scripts
- `backup-routes` — archived snapshot route implementations

## Architecture

EstateDesk is organized as a feature-driven application with strict organization scope and RBAC enforcement.

Main layers:

- UI / Pages (`src/app`)
- Domain modules (`src/features`)
- Shared services (`src/lib`)
- Database access through Prisma
- Security and rate limiting in `proxy.ts`

Authorization and membership validation are enforced at the server boundary.

## Deployment

Recommended deployment steps:

1. Set production environment variables securely.
2. Run `npx prisma migrate deploy`.
3. Build the application with `npm run build`.
4. Start using `npm run start`.

Ensure S3 storage, PostgreSQL, and optional messaging services are configured when deploying.

## Contribution Guidelines

- Keep domain logic within feature modules.
- Validate organization membership and permissions on every server-side operation.
- Preserve existing backup routes while refactoring critical flows.
- Document new environment variables in `.env.example`.
- Update `SITEMAPS.md` if you add new marketing or public pages.

## Additional Documentation

For deeper architecture, data model, developer workflows, and operational guidance, see:

- `docs/PROJECT_DOCUMENTATION.md`
- `docs/PRODUCT_DOCUMENTATION.md`
- `docs/OPERATIONS.md`
- `docs/LAUNCH_READINESS.md`

## Product and Market Context

EstateDesk is built for Kenyan property businesses and emphasizes:

- portfolio and occupancy control
- revenue workflows and collections
- service operations and issue accountability
- management insight and auditability
- role-based collaboration across admins, managers, accountants, caretakers, and tenants

For the original product vision, user roles, and market fit, the current README content can be used as a high-level product reference.
