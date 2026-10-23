#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import { parseLoadSessions } from "./lib/load-sessions.mjs";

const ORG_ADMIN_ROUTES = [
  { path: "/dashboard/org", method: "GET", weight: 24, expectedStatus: [200] },
  { path: "/dashboard/org/tenants", method: "GET", weight: 18, expectedStatus: [200, 429] },
  { path: "/dashboard/org/units", method: "GET", weight: 14, expectedStatus: [200] },
  { path: "/dashboard/org/properties", method: "GET", weight: 12, expectedStatus: [200] },
  { path: "/dashboard/org/payments", method: "GET", weight: 10, expectedStatus: [200] },
  { path: "/dashboard/org/issues", method: "GET", weight: 10, expectedStatus: [200] },
  { path: "/dashboard/org/reports", method: "GET", weight: 4, expectedStatus: [200] },
  { path: "/dashboard/security", method: "GET", weight: 4, expectedStatus: [200] },
  { path: "/api/health", method: "GET", weight: 4, expectedStatus: [200, 503] },
];

const PLATFORM_ADMIN_ROUTES = [
  { path: "/platform", method: "GET", weight: 16, expectedStatus: [200] },
  { path: "/platform/users", method: "GET", weight: 14, expectedStatus: [200] },
  { path: "/platform/organizations", method: "GET", weight: 14, expectedStatus: [200] },
  { path: "/platform/onboarding", method: "GET", weight: 10, expectedStatus: [200] },
  { path: "/platform/messages", method: "GET", weight: 8, expectedStatus: [200] },
  { path: "/platform/payments", method: "GET", weight: 8, expectedStatus: [200] },
  { path: "/platform/subscriptions", method: "GET", weight: 7, expectedStatus: [200] },
  { path: "/platform/jobs", method: "GET", weight: 5, expectedStatus: [200] },
  { path: "/platform/system-health", method: "GET", weight: 5, expectedStatus: [200] },
  { path: "/platform/audit-logs", method: "GET", weight: 4, expectedStatus: [200] },
  { path: "/platform/rate-limits", method: "GET", weight: 3, expectedStatus: [200] },
  { path: "/dashboard/security", method: "GET", weight: 3, expectedStatus: [200] },
  { path: "/api/health", method: "GET", weight: 3, expectedStatus: [200, 503] },
];

const ROUTE_PRESETS = {
  "org-admin": ORG_ADMIN_ROUTES,
  "platform-admin": PLATFORM_ADMIN_ROUTES,
};

const PROFILES = {
  smoke: { rpm: 60, durationSeconds: 60, concurrency: 4 },
  baseline: { rpm: 500, durationSeconds: 300, concurrency: 20 },
  stage1000: { rpm: 1000, durationSeconds: 300, concurrency: 40 },
  stage2500: { rpm: 2500, durationSeconds: 600, concurrency: 100 },
  stage5000: { rpm: 5000, durationSeconds: 900, concurrency: 180 },
  users1000: { rpm: 6000, durationSeconds: 600, concurrency: 100 },
};

function readNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return value;
}

function readOptionalPositiveNumber(name) {
  const raw = process.env[name];
  if (!raw) return 0;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return value;
}

function percentile(sorted, value) {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((value / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function formatMs(value) {
  return `${Math.round(value)}ms`;
}

function buildCookieHeader() {
  if (process.env.LOAD_COOKIE_HEADER) return process.env.LOAD_COOKIE_HEADER;
  if (process.env.LOAD_SESSION_COOKIE) {
    return `estatedesk_session=${process.env.LOAD_SESSION_COOKIE}`;
  }

  return "";
}

async function readRoutes() {
  const routeFile = process.env.LOAD_ROUTES_FILE;
  const presetName = process.env.LOAD_ROUTE_PRESET ?? "org-admin";

  if (!routeFile) {
    const preset = ROUTE_PRESETS[presetName];
    if (!preset) {
      throw new Error(
        `Unknown LOAD_ROUTE_PRESET "${presetName}". Use one of: ${Object.keys(ROUTE_PRESETS).join(", ")}.`,
      );
    }

    return preset;
  }

  const parsed = JSON.parse(await readFile(routeFile, "utf8"));
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("LOAD_ROUTES_FILE must contain a non-empty JSON array.");
  }

  return parsed.map((route) => ({
    path: String(route.path),
    method: String(route.method ?? "GET").toUpperCase(),
    weight: Number(route.weight ?? 1),
    expectedStatus: Array.isArray(route.expectedStatus)
      ? route.expectedStatus.map(Number)
      : [Number(route.expectedStatus ?? 200)],
  }));
}

function createPicker(routes) {
  const expanded = [];
  for (const route of routes) {
    const weight = Math.max(1, Math.round(route.weight));
    for (let index = 0; index < weight; index += 1) {
      expanded.push(route);
    }
  }

  return () => expanded[Math.floor(Math.random() * expanded.length)];
}

function printUsage() {
  console.log(`EstateDesk load test

Required:
  LOAD_BASE_URL=https://your-domain.example

Useful:
  LOAD_PROFILE=smoke|baseline|stage1000|stage2500|stage5000|users1000
  LOAD_SESSIONS_FILE=/private/path/sessions.json
  LOAD_RPM=5000
  LOAD_DURATION_SECONDS=900
  LOAD_CONCURRENCY=180
  LOAD_SESSION_COOKIE=<estatedesk_session cookie value>
  LOAD_COOKIE_HEADER="estatedesk_session=...; other=value"
  LOAD_ROUTE_PRESET=org-admin|platform-admin
  LOAD_ROUTES_FILE=scripts/load-test-routes.example.json
  LOAD_REQUEST_TIMEOUT_MS=15000
  LOAD_OUTPUT=/tmp/load-report.json
  LOAD_FAIL_ON_ERROR_RATE=1
  LOAD_FAIL_ON_P95_MS=1500
  LOAD_FAIL_ON_SCHEDULING_P95_MS=1000
  LOAD_FAIL_ON_ROUTE_P95_MS=1500
  LOAD_MIN_REQUESTS_PER_ROUTE=10
  LOAD_ABORT_AFTER_REQUESTS=250
`);
}

async function main() {
  if (process.argv.includes("--help")) {
    printUsage();
    return;
  }

  const baseUrl = process.env.LOAD_BASE_URL;
  if (!baseUrl) {
    printUsage();
    throw new Error("LOAD_BASE_URL is required.");
  }

  const profileName = process.env.LOAD_PROFILE ?? "smoke";
  const profile = PROFILES[profileName] ?? PROFILES.smoke;
  const cookieHeader = buildCookieHeader();
  const sessions = process.env.LOAD_SESSIONS_FILE
    ? parseLoadSessions(JSON.parse(await readFile(process.env.LOAD_SESSIONS_FILE, "utf8")))
    : [{ cookieHeader }];
  if (profileName === "users1000" && sessions.length < 1000) {
    throw new Error("users1000 requires at least 1,000 distinct test-user sessions in LOAD_SESSIONS_FILE.");
  }
  const rpm = readNumber("LOAD_RPM", profileName === "users1000" ? sessions.length * 6 : profile.rpm);
  const durationSeconds = readNumber("LOAD_DURATION_SECONDS", profile.durationSeconds);
  const concurrency = Math.min(
    Math.floor(readNumber("LOAD_CONCURRENCY", profile.concurrency)),
    Math.floor(rpm),
  );
  const requestIntervalMs = 60_000 / rpm;
  const totalRequests = Math.floor((rpm * durationSeconds) / 60);
  const failOnErrorRate = readOptionalPositiveNumber("LOAD_FAIL_ON_ERROR_RATE") || (profileName === "users1000" ? 1 : 0);
  const failOnP95Ms = readOptionalPositiveNumber("LOAD_FAIL_ON_P95_MS") || (profileName === "users1000" ? 1500 : 0);
  const failOnRouteP95Ms = readOptionalPositiveNumber("LOAD_FAIL_ON_ROUTE_P95_MS");
  const minRequestsPerRoute = readOptionalPositiveNumber("LOAD_MIN_REQUESTS_PER_ROUTE");
  const failOnSchedulingP95Ms = readOptionalPositiveNumber("LOAD_FAIL_ON_SCHEDULING_P95_MS") || (profileName === "users1000" ? 1000 : 0);
  const abortAfterRequests = Math.floor(readNumber("LOAD_ABORT_AFTER_REQUESTS", 250));
  const requestTimeoutMs = readNumber("LOAD_REQUEST_TIMEOUT_MS", 15_000);
  const origin = new URL(baseUrl);
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error("LOAD_BASE_URL must be an HTTP(S) URL without credentials.");
  }
  const routes = await readRoutes();
  for (const route of routes) {
    const target = new URL(route.path, origin);
    if (!route.path.startsWith("/") || route.path.startsWith("//") || target.origin !== origin.origin) {
      throw new Error("Load routes must be paths on LOAD_BASE_URL; refusing to send credentials to another origin.");
    }
    if (!["GET", "HEAD"].includes(route.method)) throw new Error("Load tests only support read-only GET/HEAD requests.");
  }
  if (!totalRequests || !concurrency) throw new Error("Load configuration must schedule at least one request with one worker.");
  const routePreset = process.env.LOAD_ROUTES_FILE
    ? "custom"
    : (process.env.LOAD_ROUTE_PRESET ?? "org-admin");
  const pickRoute = createPicker(routes);
  if (process.env.LOAD_SESSIONS_FILE && totalRequests < sessions.length) {
    throw new Error("Schedule at least one request per supplied session.");
  }
  const exercisedSessions = new Set();
  const userAgent = process.env.LOAD_USER_AGENT ?? "EstateDeskLoadTest/1.0";

  const latencies = [];
  const scheduleDelays = [];
  const statuses = new Map();
  const redirects = new Map();
  const routeStats = new Map();
  const errors = [];
  let completed = 0;
  let failed = 0;
  let nextRequest = 0;
  let abortReason = "";

  console.log(
    JSON.stringify(
      {
        event: "load-test-start",
        baseUrl: origin.origin,
        profile: profileName,
        routePreset,
        rpm,
        durationSeconds,
        concurrency,
        totalRequests,
        suppliedSessions: sessions.length,
        routes: routes.map(({ path, weight }) => ({ path, weight })),
      },
      null,
      2,
    ),
  );

  async function worker() {
    while (true) {
      if (abortReason) return;

      const requestNumber = nextRequest;
      nextRequest += 1;

      if (requestNumber >= totalRequests) return;

      const scheduledAt = requestNumber * requestIntervalMs;
      const waitMs = startedAt + scheduledAt - performance.now();
      if (waitMs > 0) await sleep(waitMs);

      scheduleDelays.push(Math.max(0, performance.now() - startedAt - scheduledAt));
      const route = pickRoute();
      const sessionIndex = requestNumber % sessions.length;
      const session = sessions[sessionIndex];
      exercisedSessions.add(sessionIndex);
      const url = new URL(route.path, origin);
      const started = performance.now();
      let status = 0;
      let ok = false;

      try {
        const headers = {
          accept: "text/html,application/json;q=0.9,*/*;q=0.8",
          "user-agent": `${userAgent} session/${sessionIndex + 1}`,
        };

        if (session.cookieHeader) headers.cookie = session.cookieHeader;

        const response = await fetch(url, {
          method: route.method,
          headers,
          redirect: "manual",
          signal: AbortSignal.timeout(requestTimeoutMs),
        });

        status = response.status;
        const location = response.headers.get("location");
        if (location) {
          const target = new URL(location, url);
          const redirectKey = `${route.path} -> ${target.pathname}${target.search}`;
          redirects.set(redirectKey, (redirects.get(redirectKey) ?? 0) + 1);
        }
        const body = await response.text();
        const streamedRedirect = /<meta id="__next-page-redirect"[^>]*http-equiv="refresh"/.test(body);
        ok = route.expectedStatus.includes(status) && !streamedRedirect
          && (profileName !== "users1000" || status < 400);
        if (streamedRedirect) errors.push({ path: route.path, message: "Streamed framework redirect; expected page content was not served." });
      } catch (error) {
        errors.push({
          path: route.path,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      const latency = performance.now() - started;
      completed += 1;
      latencies.push(latency);
      statuses.set(status, (statuses.get(status) ?? 0) + 1);

      const existing = routeStats.get(route.path) ?? {
        count: 0,
        failed: 0,
        totalLatency: 0,
        latencies: [],
      };
      existing.count += 1;
      existing.failed += ok ? 0 : 1;
      existing.totalLatency += latency;
      existing.latencies.push(latency);
      routeStats.set(route.path, existing);

      if (!ok) failed += 1;

      if (
        !abortReason &&
        failOnErrorRate > 0 &&
        completed >= abortAfterRequests &&
        (failed / completed) * 100 > failOnErrorRate
      ) {
        abortReason =
          `error rate ${((failed / completed) * 100).toFixed(2)}% exceeded ${failOnErrorRate}% after ${completed} requests`;
      }

      if (!abortReason && completed >= abortAfterRequests && completed % 50 === 0) {
        const recentLatency = percentile(latencies.slice(-250).sort((a, b) => a - b), 95);
        const recentDelay = percentile(scheduleDelays.slice(-250).sort((a, b) => a - b), 95);
        if (failOnP95Ms > 0 && recentLatency > failOnP95Ms) {
          abortReason = `recent request p95 ${Math.round(recentLatency)}ms exceeded ${failOnP95Ms}ms`;
        } else if (failOnSchedulingP95Ms > 0 && recentDelay > failOnSchedulingP95Ms) {
          abortReason = `recent scheduling p95 ${Math.round(recentDelay)}ms exceeded ${failOnSchedulingP95Ms}ms`;
        }
      }

      if (completed % Math.max(1, Math.floor(rpm / 2)) === 0) {
        process.stdout.write(
          `progress ${completed}/${totalRequests} requests, failures ${failed}\n`,
        );
      }
    }
  }

  const startedAt = performance.now();
  await Promise.all(
    Array.from({ length: concurrency }, () => worker()),
  );

  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  latencies.sort((a, b) => a - b);
  scheduleDelays.sort((a, b) => a - b);
  for (const stats of routeStats.values()) stats.latencies.sort((a, b) => a - b);
  const routeLatencyFailures = failOnRouteP95Ms > 0
    ? [...routeStats.entries()].filter(([, stats]) => percentile(stats.latencies, 95) > failOnRouteP95Ms).map(([path]) => path)
    : [];
  const routeCoverageFailures = minRequestsPerRoute > 0
    ? routes.filter(route => (routeStats.get(route.path)?.count ?? 0) < minRequestsPerRoute).map(route => route.path)
    : [];
  const routeErrorFailures = failOnRouteP95Ms > 0 && failOnErrorRate > 0
    ? [...routeStats.entries()].filter(([, stats]) => stats.failed / stats.count * 100 > failOnErrorRate).map(([path]) => path)
    : [];

  const summary = {
    requestedRpm: rpm,
    suppliedSessions: sessions.length,
    exercisedSessions: exercisedSessions.size,
    achievedRpm: Math.round((completed / elapsedSeconds) * 60),
    completed,
    failed,
    errorRatePercent: completed > 0 ? Number(((failed / completed) * 100).toFixed(2)) : 0,
    elapsedSeconds: Number(elapsedSeconds.toFixed(1)),
    // Late workers indicate the offered rate exceeds available concurrency.
    schedulingDelay: {
      p95: formatMs(percentile(scheduleDelays, 95)),
      max: formatMs(scheduleDelays.at(-1) ?? 0),
    },
    latency: {
      min: formatMs(latencies[0] ?? 0),
      p50: formatMs(percentile(latencies, 50)),
      p95: formatMs(percentile(latencies, 95)),
      p99: formatMs(percentile(latencies, 99)),
      max: formatMs(latencies[latencies.length - 1] ?? 0),
    },
    statuses: Object.fromEntries([...statuses.entries()].sort(([a], [b]) => a - b)),
    redirects: Object.fromEntries(
      [...redirects.entries()].sort(([, a], [, b]) => b - a),
    ),
    routes: Object.fromEntries(
      [...routeStats.entries()].map(([path, stats]) => [
        path,
        {
          requests: stats.count,
          failures: stats.failed,
          errorRatePercent: Number((stats.failed / stats.count * 100).toFixed(2)),
          averageLatencyMs: Math.round(stats.totalLatency / stats.count),
          p95LatencyMs: Math.round(percentile(stats.latencies, 95)),
          p99LatencyMs: Math.round(percentile(stats.latencies, 99)),
        },
      ]),
    ),
    abortReason: abortReason || null,
    routeLatencyFailures,
    routeCoverageFailures,
    routeErrorFailures,
    sampleErrors: errors.slice(0, 10),
  };

  const report = { event: "load-test-summary", summary };
  if (process.env.LOAD_OUTPUT) await writeFile(process.env.LOAD_OUTPUT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  const p95 = percentile(latencies, 95);

  if (
    abortReason ||
    routeLatencyFailures.length > 0 ||
    routeCoverageFailures.length > 0 ||
    routeErrorFailures.length > 0 ||
    (failOnErrorRate > 0 && summary.errorRatePercent > failOnErrorRate) ||
    (failOnP95Ms > 0 && p95 > failOnP95Ms) ||
    (failOnSchedulingP95Ms > 0 && percentile(scheduleDelays, 95) > failOnSchedulingP95Ms)
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
