import "dotenv/config";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, OrgRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeDatabaseUrlSslMode } from "../apps/web/src/lib/config/env";
import {
  createSessionCookieValue,
  getSessionCookieName,
} from "../apps/web/src/lib/auth/cookies";

function hashSessionToken(token: string) {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.CRON_SECRET ??
    process.env.DATABASE_URL ??
    "estatedesk-local-token-hash-secret";

  return crypto
    .createHmac("sha256", secret)
    .update("session")
    .update("\0")
    .update(token)
    .digest("hex");
}

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), ".qa-screenshots");
const QA_USER_AGENT = "tenant-portal-visual-qa";

const connectionString = process.env.DATABASE_URL
  ? normalizeDatabaseUrlSslMode(process.env.DATABASE_URL)
  : undefined;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type PageCheck = {
  path: string;
  label: string;
  mustInclude: string[];
  mustNotInclude?: string[];
};

const AUTH_FAILURE_MARKERS = [
  "SECURE LOG IN",
  "you@company.com or landlord01",
  "No tenant profile is linked to your account.",
];

const PAGES: PageCheck[] = [
  {
    path: "/dashboard/tenant",
    label: "overview",
    mustInclude: ["Welcome back,", "Recent activity", "Quick navigation"],
    mustNotInclude: ["👋", "Tenant Space", "No active tenancy"],
  },
  {
    path: "/dashboard/tenant/profile",
    label: "profile",
    mustInclude: ["Personal information", "Account access", "Current tenancy"],
    mustNotInclude: ["👋", "No tenant profile"],
  },
  {
    path: "/dashboard/tenant/lease",
    label: "lease",
    mustInclude: ["My lease", "Tenancy records"],
    mustNotInclude: ["No tenant profile"],
  },
  {
    path: "/dashboard/tenant/payments",
    label: "payments",
    mustInclude: ["My Payments", "Export statement"],
    mustNotInclude: ["No tenant profile"],
  },
  {
    path: "/dashboard/tenant/notifications",
    label: "notifications",
    mustInclude: ["Notifications"],
    mustNotInclude: ["/tenants/notifications"],
  },
];

function fetchHtml(cookie: string, pagePath: string) {
  const result = spawnSync(
    "curl",
    [
      "-s",
      "-L",
      "-A",
      QA_USER_AGENT,
      "-H",
      `Cookie: ${cookie}`,
      `${BASE_URL}${pagePath}`,
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );

  if (result.error) {
    throw result.error;
  }

  return result.stdout ?? "";
}

const SCREENSHOT_RUNNER = path.join(
  process.cwd(),
  "scripts",
  "tenant-portal-screenshot.ts",
);

function screenshot(cookie: string, pagePath: string, outfile: string) {
  const url = `${BASE_URL}${pagePath}`;

  const playwright = spawnSync(
    "npx",
    ["tsx", SCREENSHOT_RUNNER, cookie, url, outfile],
    {
      stdio: "pipe",
      encoding: "utf8",
      env: { ...process.env, QA_USER_AGENT },
    },
  );

  if (playwright.status === 0 && fs.existsSync(outfile)) {
    return true;
  }

  const [cookieName, ...cookieValueParts] = cookie.split("=");
  const cookieValue = cookieValueParts.join("=");
  const host = new URL(BASE_URL).hostname;
  const chromeCookie = `${cookieName}=${cookieValue};domain=${host};path=/`;

  const chrome = spawnSync(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--window-size=1440,1200",
      `--screenshot=${outfile}`,
      "--virtual-time-budget=12000",
      `--cookie=${chromeCookie}`,
      url,
    ],
    { stdio: "pipe" },
  );

  return chrome.status === 0 && fs.existsSync(outfile);
}

async function createTenantSessionCookie() {
  const preferredEmail = process.env.QA_TENANT_EMAIL?.trim();

  const user = preferredEmail
    ? await prisma.user.findFirst({
        where: { email: preferredEmail, status: "ACTIVE" },
        select: { id: true, email: true },
      })
    : await prisma.user.findFirst({
        where: {
          status: "ACTIVE",
          memberships: {
            some: { role: OrgRole.TENANT, employmentEndedAt: null },
          },
          tenant: {
            is: {
              deletedAt: null,
              leases: {
                some: { deletedAt: null, status: "ACTIVE" },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true },
      });

  if (!user) {
    throw new Error(
      preferredEmail
        ? `Tenant user ${preferredEmail} not found.`
        : "No active tenant user found. Run seed or set QA_TENANT_EMAIL.",
    );
  }

  console.log(`Using tenant session for ${user.email}`);

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, role: OrgRole.TENANT, employmentEndedAt: null },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("Tenant membership not found for seed user.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.userSession.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lte: new Date() },
    },
  });

  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      activeMembershipId: membership.id,
      userAgent: QA_USER_AGENT,
      ipAddress: "127.0.0.1",
    },
  });

  const cookieName = getSessionCookieName();
  const cookieValue = createSessionCookieValue(token);
  return `${cookieName}=${cookieValue}`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cookie = await createTenantSessionCookie();
  const results: Array<{
    label: string;
    path: string;
    ok: boolean;
    issues: string[];
    screenshot?: string;
  }> = [];

  for (const page of PAGES) {
    const issues: string[] = [];
    const html = fetchHtml(cookie, page.path);

    for (const marker of AUTH_FAILURE_MARKERS) {
      if (html.includes(marker)) {
        issues.push(`Auth/content failure marker found: "${marker}"`);
      }
    }

    for (const text of page.mustInclude) {
      if (!html.includes(text)) {
        issues.push(`Missing expected text: "${text}"`);
      }
    }

    for (const text of page.mustNotInclude ?? []) {
      if (html.includes(text)) {
        issues.push(`Found unwanted text: "${text}"`);
      }
    }

    const shotPath = path.join(OUT_DIR, `${page.label}.png`);
    const shotOk = screenshot(cookie, page.path, shotPath);

    if (
      page.label === "profile" &&
      !html.includes("Contact & payment details") &&
      !html.includes("Contact & payments")
    ) {
      console.log(
        `       note: contact strip hidden (org has no office/payment contact on file)`,
      );
    }

    results.push({
      label: page.label,
      path: page.path,
      ok: issues.length === 0,
      issues,
      screenshot: shotOk ? shotPath : undefined,
    });
  }

  console.log("\nTenant portal visual QA\n");
  for (const result of results) {
    const status = result.ok ? "PASS" : "FAIL";
    console.log(`${status}  ${result.path} (${result.label})`);
    if (result.screenshot) {
      console.log(`       screenshot: ${result.screenshot}`);
    }
    for (const issue of result.issues) {
      console.log(`       - ${issue}`);
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});