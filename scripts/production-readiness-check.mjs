#!/usr/bin/env node
/**
 * Offline production readiness env check (no DB).
 * Usage: node scripts/production-readiness-check.mjs
 *
 * Exit 0 if required env looks present; exit 1 if blocking env fails.
 * Operator gates (legal, restore, GSC) are always printed as pending.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const root = resolve(process.cwd());
loadDotEnv(resolve(root, "apps/web/.env"));
loadDotEnv(resolve(root, ".env"));
loadDotEnv(resolve(root, ".env.production"));

function has(key) {
  return Boolean(process.env[key]?.trim());
}

const checks = [
  { key: "DATABASE_URL", required: true, label: "Database" },
  { key: "DIRECT_URL", required: false, label: "Direct DB URL (migrations)" },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    label: "Public app URL",
    alt: "APP_URL",
  },
  { key: "CRON_SECRET", required: true, label: "Cron secret" },
  {
    key: "SECURITY_ALERT_WEBHOOK_URL",
    required: false,
    label: "Security alert webhook",
    alt: "ALERT_WEBHOOK_URL",
  },
  { key: "MPESA_CONSUMER_KEY", required: false, label: "M-Pesa consumer key" },
  { key: "MPESA_CONSUMER_SECRET", required: false, label: "M-Pesa secret" },
  { key: "MPESA_SHORTCODE", required: false, label: "M-Pesa shortcode" },
  { key: "MPESA_PASSKEY", required: false, label: "M-Pesa passkey" },
  { key: "MPESA_CALLBACK_URL", required: false, label: "M-Pesa callback URL" },
  {
    key: "KCB_BUNI_IPN_SIGNATURE_SECRET",
    required: false,
    label: "KCB IPN secret",
  },
  { key: "VAPID_PUBLIC_KEY", required: false, label: "Web Push VAPID public" },
  { key: "VAPID_PRIVATE_KEY", required: false, label: "Web Push VAPID private" },
];

const operatorGates = [
  "Kenya legal counsel sign-off → docs/KENYA_LEGAL_REVIEW.md",
  "Disposable backup restore drill → docs/RESTORE_DRILL_EVIDENCE.md",
  "Live M-Pesa STK E2E on production domain",
  "Enable production crons (notifications, retention, owner statements)",
  "External uptime on /api/health and /api/health?deep=1",
  "Submit sitemap-index.xml to GSC/Bing",
  "Manual accessibility QA matrix → docs/ACCESSIBILITY_QA.md",
];

let blockingFails = 0;
let warns = 0;

console.log("EstateDesk production readiness (env)\n");

for (const check of checks) {
  const ok = has(check.key) || (check.alt ? has(check.alt) : false);
  if (!ok && check.required) {
    blockingFails += 1;
    console.log(`FAIL  ${check.label} (${check.key}${check.alt ? ` or ${check.alt}` : ""})`);
  } else if (!ok) {
    warns += 1;
    console.log(`WARN  ${check.label} (${check.key})`);
  } else {
    console.log(`PASS  ${check.label}`);
  }
}

console.log("\nOperator gates (cannot be automated):\n");
for (const gate of operatorGates) {
  console.log(`TODO  ${gate}`);
}

console.log(
  `\nSummary: ${blockingFails} blocking env fails, ${warns} optional warns, ${operatorGates.length} operator TODOs.`,
);
console.log(
  "In-app report: /platform/system-health after login as platform admin.\n",
);

process.exit(blockingFails > 0 ? 1 : 0);
