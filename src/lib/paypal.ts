/**
 * PayPal server client (sandbox-ready).
 *
 * Split into two layers for testability:
 *  - PURE helpers (no network): `toMoneyString`, `encodeFundCustomId`,
 *    `parseFundFromCustomId`, `mapWebhookEvent`. These hold the parsing logic
 *    and are exhaustively unit-tested.
 *  - THIN fetch wrappers: `getAccessToken`, `createOrder`, `captureOrder`,
 *    `createSubscription`, `verifyWebhookSignature`. They only build requests
 *    and read responses; tests mock `global.fetch`.
 *
 * Server-only: reads PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_WEBHOOK_ID
 * from process.env. Never import this from client code.
 */
import { FUNDS, type Fund } from "@/lib/validation";

const API_BASE =
  process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Format a number as a PayPal-safe 2-decimal money string. */
export function toMoneyString(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Encode a fund into a PayPal `custom_id`. PayPal echoes `custom_id` back on the
 * capture/webhook so we can recover which fund a gift was for. We prefix it so
 * the value is unambiguous even if PayPal ever mingles other data.
 */
export function encodeFundCustomId(fund: Fund): string {
  return `fund:${fund}`;
}

/**
 * Recover a fund from a `custom_id` (or any string that may contain one).
 * Accepts both the encoded form ("fund:Tithe") and a bare fund value
 * ("Tithe"). Returns null when no valid fund can be parsed.
 */
export function parseFundFromCustomId(
  customId: string | null | undefined,
): Fund | null {
  if (!customId) return null;
  const raw = customId.startsWith("fund:") ? customId.slice(5) : customId;
  return (FUNDS as readonly string[]).includes(raw) ? (raw as Fund) : null;
}

// Normalized webhook records returned by `mapWebhookEvent`.
export type DonationWebhook = {
  kind: "donation";
  paypalOrderId: string;
  amount: number;
  currency: string;
  fund: Fund | null;
  status: string;
};

export type SubscriptionWebhook = {
  kind: "subscription";
  paypalSubscriptionId: string;
  status: string;
  planName?: string;
  amount?: number;
  fund?: Fund | null;
};

export type MappedWebhook = DonationWebhook | SubscriptionWebhook;

type AnyEvent = {
  event_type?: string;
  resource?: Record<string, unknown>;
};

/**
 * PURE: normalize a PayPal webhook event into our domain shape.
 *  - PAYMENT.CAPTURE.COMPLETED          -> donation
 *  - BILLING.SUBSCRIPTION.*             -> subscription (status from resource)
 *  - anything else                      -> null (caller acks with 200)
 */
export function mapWebhookEvent(event: unknown): MappedWebhook | null {
  if (!event || typeof event !== "object") return null;
  const { event_type: type, resource } = event as AnyEvent;
  if (!type) return null;
  const res = (resource ?? {}) as Record<string, unknown>;

  if (type === "PAYMENT.CAPTURE.COMPLETED") {
    const amountObj = (res.amount ?? {}) as {
      value?: string;
      currency_code?: string;
    };
    const supplementary = (res.supplementary_data ?? {}) as {
      related_ids?: { order_id?: string };
    };
    const orderId =
      supplementary.related_ids?.order_id ?? (res.id as string | undefined);
    if (!orderId) return null;
    return {
      kind: "donation",
      paypalOrderId: orderId,
      amount: Number(amountObj.value ?? 0),
      currency: amountObj.currency_code ?? "USD",
      fund: parseFundFromCustomId(res.custom_id as string | undefined),
      status: "COMPLETED",
    };
  }

  if (type.startsWith("BILLING.SUBSCRIPTION.")) {
    const id = res.id as string | undefined;
    if (!id) return null;
    const status =
      (res.status as string | undefined) ?? type.split(".").pop() ?? "UNKNOWN";
    return {
      kind: "subscription",
      paypalSubscriptionId: id,
      status,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Thin fetch wrappers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/** OAuth2 client-credentials token. Wraps global fetch for testability. */
export async function getAccessToken(): Promise<string> {
  const clientId = requireEnv("PAYPAL_CLIENT_ID");
  const secret = requireEnv("PAYPAL_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal token request failed: ${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal token response missing access_token");
  return data.access_token;
}

async function authedFetch(
  path: string,
  body: unknown,
): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export type CreateOrderInput = {
  amount: number;
  currency: string;
  fund: Fund;
};

/** Create a CAPTURE-intent order. Returns { id, status }. */
export async function createOrder({
  amount,
  currency,
  fund,
}: CreateOrderInput): Promise<{ id: string; status: string }> {
  const res = await authedFetch("/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: toMoneyString(amount),
        },
        custom_id: encodeFundCustomId(fund),
        description: `${fund} gift — RCCG Covenant Embassy`,
      },
    ],
  });
  if (!res.ok) throw new Error(`PayPal createOrder failed: ${res.status}`);
  const data = (await res.json()) as { id: string; status: string };
  return { id: data.id, status: data.status };
}

/** Capture a previously-created order. Returns the raw capture result. */
export async function captureOrder(orderId: string): Promise<{
  id: string;
  status: string;
  payer?: unknown;
  purchase_units?: unknown;
  [key: string]: unknown;
}> {
  const res = await authedFetch(
    `/v2/checkout/orders/${orderId}/capture`,
    {},
  );
  if (!res.ok) throw new Error(`PayPal captureOrder failed: ${res.status}`);
  return (await res.json()) as { id: string; status: string };
}

export type CreateSubscriptionInput = {
  planId: string;
  amount: number;
  fund: Fund;
  subscriberEmail?: string;
};

/**
 * Create a subscription against a pre-provisioned PayPal billing plan.
 *
 * TODO: plan ids are provisioned out-of-band (see giving-config.planIdFor).
 * The amount/fund are recorded by us (and echoed via custom_id) but the actual
 * billed amount is governed by the plan. Returns { id, status }.
 */
export async function createSubscription({
  planId,
  fund,
  subscriberEmail,
}: CreateSubscriptionInput): Promise<{ id: string; status: string }> {
  const body: Record<string, unknown> = {
    plan_id: planId,
    custom_id: encodeFundCustomId(fund),
  };
  if (subscriberEmail) {
    body.subscriber = { email_address: subscriberEmail };
  }
  const res = await authedFetch("/v1/billing/subscriptions", body);
  if (!res.ok) throw new Error(`PayPal createSubscription failed: ${res.status}`);
  const data = (await res.json()) as { id: string; status: string };
  return { id: data.id, status: data.status };
}

// PayPal transmission headers used for webhook signature verification.
const TRANSMISSION_HEADERS = [
  "paypal-transmission-id",
  "paypal-transmission-time",
  "paypal-cert-url",
  "paypal-auth-algo",
  "paypal-transmission-sig",
] as const;

/** Read a header case-insensitively from a plain object or Headers instance. */
function readHeader(
  headers: Record<string, string> | Headers,
  name: string,
): string | undefined {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(
    headers as Record<string, string>,
  )) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

/**
 * Verify a webhook signature via PayPal's verify-webhook-signature API.
 * Returns true only when verification_status === "SUCCESS".
 */
export async function verifyWebhookSignature(
  headers: Record<string, string> | Headers,
  rawBody: string,
): Promise<boolean> {
  const webhookId = requireEnv("PAYPAL_WEBHOOK_ID");
  const [
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    transmissionSig,
  ] = TRANSMISSION_HEADERS.map((h) => readHeader(headers, h));

  let webhookEvent: unknown;
  try {
    webhookEvent = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const res = await authedFetch("/v1/notifications/verify-webhook-signature", {
    transmission_id: transmissionId,
    transmission_time: transmissionTime,
    cert_url: certUrl,
    auth_algo: authAlgo,
    transmission_sig: transmissionSig,
    webhook_id: webhookId,
    webhook_event: webhookEvent,
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
