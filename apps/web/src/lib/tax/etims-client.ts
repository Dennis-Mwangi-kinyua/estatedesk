/**
 * KRA eTIMS / eRITS client — production-shaped integration.
 *
 * Uses org or platform credentials to obtain tokens and submit sales receipts
 * built from EstateDesk payment/receipt snapshots. When credentials are missing,
 * methods return a structured "unconfigured" result without throwing.
 *
 * Keep free of `server-only` so pure config/payload helpers stay unit-testable.
 */

import {
  buildEtimsReadyReceiptFields,
  type BuildEtimsReceiptInput,
  type EtimsReceiptFields,
} from "@/lib/tax/etims-receipt";

export type EtimsEnvironment = "sandbox" | "production" | "unconfigured";

export type EtimsClientConfig = {
  environment: EtimsEnvironment;
  baseUrl: string | null;
  clientId: string | null;
  clientSecret: string | null;
  webhookSecret: string | null;
  controlUnitSerial: string | null;
  branchOfficeId: string | null;
  configured: boolean;
};

export type EtimsSubmitResult = {
  ok: boolean;
  mode: "live" | "dry_run" | "skipped";
  environment: EtimsEnvironment;
  httpStatus?: number;
  receiptNumber?: string | null;
  kraReceiptNo?: string | null;
  internalData?: string | null;
  signature?: string | null;
  message: string;
  payload?: Record<string, unknown>;
  responseBody?: unknown;
};

function trimEnv(key: string) {
  return process.env[key]?.trim() || null;
}

export function getEtimsClientConfig(): EtimsClientConfig {
  const rawEnv = (trimEnv("KRA_ETIMS_ENVIRONMENT") || "").toLowerCase();
  const clientId = trimEnv("KRA_ETIMS_CLIENT_ID");
  const clientSecret = trimEnv("KRA_ETIMS_CLIENT_SECRET");
  const baseUrl =
    trimEnv("KRA_ETIMS_BASE_URL") ||
    (rawEnv === "production" || rawEnv === "prod"
      ? "https://etims-api.kra.go.ke"
      : "https://etims-api-sbx.kra.go.ke");
  const controlUnitSerial = trimEnv("KRA_ETIMS_CU_SERIAL");
  const webhookSecret = trimEnv("KRA_ETIMS_WEBHOOK_SECRET");

  let environment: EtimsEnvironment = "unconfigured";
  if (rawEnv === "production" || rawEnv === "prod") environment = "production";
  else if (rawEnv === "sandbox" || rawEnv === "test" || rawEnv === "sbx") {
    environment = "sandbox";
  } else if (clientId && clientSecret) {
    environment = "sandbox";
  }

  const configured = Boolean(
    clientId && clientSecret && environment !== "unconfigured",
  );

  return {
    environment: configured ? environment : "unconfigured",
    baseUrl: configured ? baseUrl : null,
    clientId,
    clientSecret,
    webhookSecret,
    controlUnitSerial,
    branchOfficeId: trimEnv("KRA_ETIMS_BHF_ID"),
    configured,
  };
}

export function isEtimsLiveConfigured() {
  return getEtimsClientConfig().configured;
}

/**
 * Build the OSCU/VSCU-style sales receipt body KRA expects from our fields.
 * Field names follow common eTIMS JSON conventions used by integrators.
 */
export function buildEtimsSalesPayload(
  fields: EtimsReceiptFields,
  config: EtimsClientConfig = getEtimsClientConfig(),
) {
  return {
    tin: fields.sellerPin,
    bhfId: config.branchOfficeId || "00",
    invcNo: fields.invoiceNumber,
    orgInvcNo: fields.invoiceNumber,
    custTin: fields.buyerPin,
    salesTyCd: "N",
    rcptTyCd: fields.receiptType === "CREDIT_NOTE" ? "R" : "S",
    pmtTyCd: "01",
    salesSttsCd: "02",
    cfmDt: fields.cuTimestamp.replace(/[-:TZ.]/g, "").slice(0, 14),
    salesDt: fields.cuTimestamp.slice(0, 10).replace(/-/g, ""),
    stockRlsDt: null,
    totItemCnt: fields.itemLines.length,
    taxblAmtA: fields.taxableAmount,
    taxblAmtB: 0,
    taxblAmtC: 0,
    taxblAmtD: 0,
    taxRtA: 0,
    taxRtB: 0,
    taxRtC: 0,
    taxRtD: 0,
    taxAmtA: fields.taxAmount,
    taxAmtB: 0,
    taxAmtC: 0,
    taxAmtD: 0,
    totTaxblAmt: fields.taxableAmount,
    totTaxAmt: fields.taxAmount,
    totAmt: fields.totalAmount,
    prchrAcptYn: "N",
    remark: "EstateDesk verified payment receipt",
    regrId: "ESTATEDESK",
    regrNm: "EstateDesk",
    modrId: "ESTATEDESK",
    modrNm: "EstateDesk",
    itemList: fields.itemLines.map((line, index) => ({
      itemSeq: index + 1,
      itemCd: `ED${String(index + 1).padStart(4, "0")}`,
      itemClsCd: "99000000",
      itemNm: line.description.slice(0, 200),
      bcd: null,
      pkgUnitCd: "NT",
      pkg: 1,
      qtyUnitCd: "U",
      qty: line.quantity,
      prc: line.unitPrice,
      splyAmt: line.total,
      dcRt: 0,
      dcAmt: 0,
      isrccCd: null,
      isrccNm: null,
      isrcRt: null,
      isrcAmt: null,
      taxTyCd: "A",
      taxblAmt: line.total,
      taxAmt: line.taxAmount,
      totAmt: line.total,
    })),
    cuSerial: fields.controlUnitSerial,
  };
}

type TokenCache = { token: string; expiresAt: number };
const tokenCache = new Map<string, TokenCache>();

function tokenCacheKey(config: EtimsClientConfig) {
  return `${config.environment}:${config.baseUrl ?? ""}:${config.clientId ?? ""}`;
}

/**
 * Fetch OAuth client-credentials token from KRA eTIMS gateway.
 * Caches in-memory until near expiry.
 */
export async function getEtimsAccessToken(
  config: EtimsClientConfig = getEtimsClientConfig(),
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  if (!config.configured || !config.baseUrl || !config.clientId || !config.clientSecret) {
    return { ok: false, message: "eTIMS credentials are not configured." };
  }

  const cacheKey = tokenCacheKey(config);
  const cachedToken = tokenCache.get(cacheKey);
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return { ok: true, token: cachedToken.token };
  }

  const tokenUrl =
    process.env.KRA_ETIMS_TOKEN_URL?.trim() ||
    `${config.baseUrl}/oauth2/v1/generate?grant_type=client_credentials`;

  try {
    const basic = Buffer.from(
      `${config.clientId}:${config.clientSecret}`,
    ).toString("base64");

    const response = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const body = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number | string;
      error?: string;
      error_description?: string;
    };

    if (!response.ok || !body.access_token) {
      return {
        ok: false,
        message:
          body.error_description ||
          body.error ||
          `Token request failed (${response.status})`,
      };
    }

    const expiresIn = Number(body.expires_in || 3500);
    tokenCache.set(cacheKey, {
      token: body.access_token,
      expiresAt: Date.now() + Math.max(60, expiresIn) * 1000,
    });
    return { ok: true, token: body.access_token };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Token request network error",
    };
  }
}

/**
 * Submit a sales receipt to KRA eTIMS.
 * When not configured, returns dry_run payload for ops inspection.
 */
export async function submitEtimsSalesReceipt(
  input: BuildEtimsReceiptInput,
  config: EtimsClientConfig = getEtimsClientConfig(),
): Promise<EtimsSubmitResult> {
  const fields = buildEtimsReadyReceiptFields({
    ...input,
    controlUnitSerial: input.controlUnitSerial ?? config.controlUnitSerial,
  });
  const payload = buildEtimsSalesPayload(fields, config);

  if (!config.configured || !config.baseUrl) {
    return {
      ok: fields.readyForSubmission === false,
      mode: "skipped",
      environment: config.environment,
      message: fields.readinessNotes.join(" ") || "eTIMS not configured — layout-ready only.",
      payload,
      receiptNumber: fields.invoiceNumber,
    };
  }

  const tokenResult = await getEtimsAccessToken(config);
  if (!tokenResult.ok) {
    return {
      ok: false,
      mode: "live",
      environment: config.environment,
      message: tokenResult.message,
      payload,
      receiptNumber: fields.invoiceNumber,
    };
  }

  const salesPath =
    process.env.KRA_ETIMS_SALES_PATH?.trim() ||
    "/etims-api/saveTrnsSalesOsdc";
  const endpoint = `${config.baseUrl.replace(/\/$/, "")}${salesPath.startsWith("/") ? "" : "/"}${salesPath}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseBody = await response.json().catch(() => null);
    const body = (responseBody || {}) as {
      resultCd?: string;
      resultMsg?: string;
      data?: {
        rcptNo?: string;
        intrlData?: string;
        rcptSign?: string;
      };
    };

    const success =
      response.ok &&
      (body.resultCd === "000" ||
        body.resultCd === "00" ||
        body.resultCd === undefined);

    return {
      ok: success,
      mode: "live",
      environment: config.environment,
      httpStatus: response.status,
      receiptNumber: fields.invoiceNumber,
      kraReceiptNo: body.data?.rcptNo ?? null,
      internalData: body.data?.intrlData ?? null,
      signature: body.data?.rcptSign ?? null,
      message: success
        ? body.resultMsg || "eTIMS sales receipt accepted"
        : body.resultMsg || `eTIMS rejected submission (${response.status})`,
      payload,
      responseBody,
    };
  } catch (error) {
    return {
      ok: false,
      mode: "live",
      environment: config.environment,
      message:
        error instanceof Error ? error.message : "eTIMS submit network error",
      payload,
      receiptNumber: fields.invoiceNumber,
    };
  }
}

export function verifyEtimsWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = getEtimsClientConfig().webhookSecret;
  if (!secret) return false;
  if (!signatureHeader) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("node:crypto") as typeof import("node:crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    const provided = signatureHeader.replace(/^sha256=/i, "").trim();
    return (
      expected.length === provided.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
    );
  } catch {
    return false;
  }
}

export function getEtimsReadinessSummary() {
  const config = getEtimsClientConfig();
  const notes: string[] = [];
  if (!config.clientId) notes.push("Missing KRA_ETIMS_CLIENT_ID");
  if (!config.clientSecret) notes.push("Missing KRA_ETIMS_CLIENT_SECRET");
  if (!config.controlUnitSerial) notes.push("Missing KRA_ETIMS_CU_SERIAL (control unit)");
  if (config.environment === "unconfigured") {
    notes.push("Set KRA_ETIMS_ENVIRONMENT to sandbox or production");
  }

  return {
    configured: config.configured,
    environment: config.environment,
    baseUrl: config.baseUrl,
    controlUnitSerial: config.controlUnitSerial,
    notes,
    statusLabel: config.configured
      ? `Live ${config.environment}`
      : "Layout-ready (credentials pending)",
  };
}
