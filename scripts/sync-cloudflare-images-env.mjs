#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";

const target = process.argv[2] ?? "production";
if (!["production", "preview", "development"].includes(target)) throw new Error("Choose production, preview, or development.");
const env = parse(readFileSync(new URL("../.env", import.meta.url)));
const values = {
  CF_IMAGES_API_TOKEN: env.CF_IMAGES_API_TOKEN?.trim(),
  CF_IMAGES_ACCOUNT_ID: (env.CF_IMAGES_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID)?.trim(),
  CF_IMAGES_HASH: (env.CF_IMAGES_HASH || env.NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH || env.CLOUDFLARE_ACCOUNT_HASH)?.trim(),
  NEXT_PUBLIC_CF_IMAGES_PUBLIC_VARIANT: env.NEXT_PUBLIC_CF_IMAGES_PUBLIC_VARIANT?.trim() || "public",
};
for (const [key, value] of Object.entries(values)) if (!value) throw new Error(`Missing ${key} in the root .env.`);
for (const [key, value] of Object.entries(values)) {
  const result = spawnSync("npx", ["--yes", "vercel@latest", "env", "add", key, target, "--force"], { input: value, stdio: ["pipe", "inherit", "inherit"], env: process.env });
  if (result.error || result.status !== 0) {
    console.error(`Could not sync ${key}. Authenticate with Vercel and link this project first.`);
    process.exit(1);
  }
  console.log(`Synced ${key} (${target}).`);
}
console.log("Redeploy the Vercel project to apply the image settings.");
